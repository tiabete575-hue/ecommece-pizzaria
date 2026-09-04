import crypto from 'crypto';
import type { OrderPayload, OrderResponse } from '../../src/types/index.ts';
import { restaurantStore } from '../data/store.ts';


const PIZZARIA_WHATSAPP_PHONE = '5561999998686'; // Brasília DF
const PIX_CHAVE = 'financeiro@gordeixosbrasilia.com.br';

export const processOrder = async (payload: OrderPayload): Promise<OrderResponse> => {
  try {
    const { cliente, itens } = payload;

    // 1. Validações básicas
    if (!cliente || !cliente.nome || cliente.nome.trim().length < 2) {
      return {
        sucesso: false,
        mensagem: 'Por favor, informe seu nome completo.',
        erro: 'NOME_INVALIDO'
      };
    }

    if (!cliente.whatsapp || cliente.whatsapp.replace(/\D/g, '').length < 10) {
      return {
        sucesso: false,
        mensagem: 'Por favor, informe um WhatsApp válido com DDD (ex: 61 98888-7777).',
        erro: 'WHATSAPP_INVALIDO'
      };
    }

    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return {
        sucesso: false,
        mensagem: 'Seu carrinho está vazio. Adicione pelo menos um item para continuar.',
        erro: 'CARRINHO_VAZIO'
      };
    }

    const currentMenu = restaurantStore.getMenu();
    const currentCrusts = restaurantStore.getCrusts();
    const currentCoupons = restaurantStore.getCoupons();
    const currentBairros = restaurantStore.getBairros();
    const currentExtras = restaurantStore.getExtras();

    // 2. Cálculo do subtotal seguro no servidor
    let calculatedSubtotal = 0;
    const validatedItens = [];

    for (const item of itens) {
      const product = currentMenu.find((p) => p.id === item.productId);
      if (!product) {
        return {
          sucesso: false,
          mensagem: `Produto "${item.name}" não foi encontrado no cardápio ativo.`,
          erro: 'PRODUTO_NAO_ENCONTRADO'
        };
      }

      if (product.available === false) {
        return {
          sucesso: false,
          mensagem: `O item "${product.name}" está temporariamente indisponível na cozinha hoje.`,
          erro: 'PRODUTO_INDISPONIVEL'
        };
      }

      let itemUnitPrice = product.basePrice;

      // Se for pizza com tamanho
      if (product.isPizza && item.sizeId) {
        const sizeOption = product.sizes?.find((s) => s.id === item.sizeId);
        if (!sizeOption) return { sucesso: false, mensagem: `Tamanho inválido para "${product.name}".`, erro: 'TAMANHO_INVALIDO' };
        itemUnitPrice = sizeOption.price;

        // Se for meio-a-meio
        if (item.isHalfHalf && item.secondFlavorId) {
          const secondProduct = currentMenu.find((p) => p.id === item.secondFlavorId);
          if (!secondProduct || secondProduct.available === false || !secondProduct.isPizza) return { sucesso: false, mensagem: 'O segundo sabor selecionado não está disponível.', erro: 'SEGUNDO_SABOR_INVALIDO' };
          const secondSize = secondProduct.sizes?.find((s) => s.id === item.sizeId);
          if (!secondSize) return { sucesso: false, mensagem: 'O segundo sabor não está disponível neste tamanho.', erro: 'SEGUNDO_SABOR_TAMANHO_INVALIDO' };
          itemUnitPrice = Math.max(itemUnitPrice, secondSize.price);
        }

        // Borda recheada
        if (item.crustId && item.crustId !== 'sem-borda') {
          const crustOption = currentCrusts.find((c) => c.id === item.crustId);
          if (!crustOption || crustOption.available === false) return { sucesso: false, mensagem: 'A borda selecionada não está disponível.', erro: 'BORDA_INVALIDA' };
          itemUnitPrice += crustOption.price;
        }
      }

      // Adicionais / Extras
      if (item.extras && Array.isArray(item.extras)) {
        const safeExtras = [];
        for (const requestedExtra of item.extras) {
          const catalogExtra = currentExtras.find((extra) => extra.id === requestedExtra.id);
          if (!catalogExtra) return { sucesso: false, mensagem: `Adicional inválido no item "${product.name}".`, erro: 'ADICIONAL_INVALIDO' };
          itemUnitPrice += catalogExtra.price;
          safeExtras.push({ id: catalogExtra.id, name: catalogExtra.name, price: catalogExtra.price });
        }
        item.extras = safeExtras;
      }

      const qty = Math.max(1, Math.floor(item.quantity || 1));
      calculatedSubtotal += itemUnitPrice * qty;

      validatedItens.push({
        ...item,
        unitPrice: Number(itemUnitPrice.toFixed(2)),
        quantity: qty
      });
    }

    // 3. Taxa de entrega / Bairro
    let taxaEntrega = 0;
    let tempoEstimado = '30-40 min';

    if (cliente.tipoEntrega === 'delivery') {
      if (!cliente.bairroId) {
        return {
          sucesso: false,
          mensagem: 'Selecione a Região Administrativa / Bairro no DF para entrega.',
          erro: 'BAIRRO_OBRIGATORIO'
        };
      }

      const bairro = currentBairros.find((b) => b.id === cliente.bairroId);
      if (!bairro || bairro.ativo === false) {
        return {
          sucesso: false,
          mensagem: 'Bairro de entrega temporariamente indisponível ou não atendido.',
          erro: 'BAIRRO_NAO_ATENDIDO'
        };
      }

      taxaEntrega = bairro.taxaEntrega;
      tempoEstimado = `${bairro.tempoMin} a ${bairro.tempoMax} min`;

      // Frete grátis por valor mínimo se aplicável
      if (bairro.freteGratisMin && calculatedSubtotal >= bairro.freteGratisMin) {
        taxaEntrega = 0;
      }

      if (!cliente.endereco || cliente.endereco.trim().length < 4) {
        return {
          sucesso: false,
          mensagem: 'Por favor, informe seu endereço completo (Quadra, Bloco/Número, Apto/Casa).',
          erro: 'ENDERECO_OBRIGATORIO'
        };
      }
    } else {
      tempoEstimado = '20 a 30 min (Pronto p/ Retirada no Balcão CLN 302 Norte)';
    }

    // 4. Desconto de Cupom
    let desconto = 0;
    if (cliente.cupom) {
      const cleanCoupon = cliente.cupom.trim().toUpperCase();
      const couponObj = currentCoupons.find((c) => c.code.toUpperCase() === cleanCoupon && c.active);
      if (couponObj && calculatedSubtotal >= couponObj.minOrder) {
        if (couponObj.discountPercent) {
          desconto = (calculatedSubtotal * couponObj.discountPercent) / 100;
        } else if (couponObj.discountAmount) {
          desconto = Math.min(couponObj.discountAmount, calculatedSubtotal);
        }
      }
    }

    // Desconto especial de 5% no PIX se não tiver cupom
    if (cliente.formaPagamento === 'pix' && desconto === 0) {
      desconto = (calculatedSubtotal * 5) / 100;
    }

    const totalCalculado = Number((calculatedSubtotal - desconto + taxaEntrega).toFixed(2));

    // 5. Gerar número de pedido sequencial amigável
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const numeroPedido = `#GDX-${randomSuffix}`;
    const orderTimestamp = Date.now();
    const dataHora = new Date(orderTimestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    // 6. Montar texto formatado do WhatsApp
    const linhasMensagem: string[] = [];
    linhasMensagem.push(`🍕 *NOVO PEDIDO - GORDEIXO'S PIZZARIA (Desde 1986)*`);
    linhasMensagem.push(`📋 *Pedido:* ${numeroPedido}`);
    linhasMensagem.push(`📅 *Data:* ${dataHora}`);
    linhasMensagem.push(`----------------------------------------`);
    linhasMensagem.push(`👤 *CLIENTE:*`);
    linhasMensagem.push(`• *Nome:* ${cliente.nome}`);
    linhasMensagem.push(`• *WhatsApp:* ${cliente.whatsapp}`);
    linhasMensagem.push(`• *Modalidade:* ${cliente.tipoEntrega === 'delivery' ? '🛵 Entrega Delivery' : '🏪 Retirada no Balcão'}`);

    if (cliente.tipoEntrega === 'delivery') {
      if (cliente.cep) linhasMensagem.push(`• *CEP:* ${cliente.cep}`);
      linhasMensagem.push(`• *Região / Bairro:* ${cliente.bairroNome || 'DF'}`);
      linhasMensagem.push(`• *Endereço:* ${cliente.endereco}${cliente.numero ? `, nº ${cliente.numero}` : ''}`);
      if (cliente.complemento) linhasMensagem.push(`• *Complemento/Bloco/Apto:* ${cliente.complemento}`);
      if (cliente.referencia) linhasMensagem.push(`• *Ponto de Ref:* ${cliente.referencia}`);
    } else {
      linhasMensagem.push(`• *Local de Retirada:* Unidade Asa Norte - CLN 302 Bloco B`);
    }

    linhasMensagem.push(`----------------------------------------`);
    linhasMensagem.push(`🛒 *ITENS DO PEDIDO:*`);

    validatedItens.forEach((it, idx) => {
      const itemSubtotal = (it.unitPrice * it.quantity).toFixed(2).replace('.', ',');
      let descItem = `${idx + 1}. *${it.quantity}x ${it.name}*`;

      if (it.isHalfHalf && it.secondFlavorName) {
        descItem += `\n   ↳ _Meio a Meio com:_ ${it.secondFlavorName}`;
      }

      if (it.sizeName) {
        descItem += `\n   ↳ _Tamanho:_ ${it.sizeName}`;
      }

      if (it.crustName && it.crustName !== 'Massa Tradicional (Sem recheio extra)') {
        descItem += `\n   ↳ _Borda:_ ${it.crustName}`;
      }

      if (it.extras && it.extras.length > 0) {
        descItem += `\n   ↳ _Adicionais:_ ${it.extras.map((e) => e.name).join(', ')}`;
      }

      if (it.observations) {
        descItem += `\n   ↳ _Obs:_ "${it.observations}"`;
      }

      descItem += `\n   ↳ *R$ ${itemSubtotal}*`;
      linhasMensagem.push(descItem);
    });

    linhasMensagem.push(`----------------------------------------`);
    linhasMensagem.push(`💰 *VALORES:*`);
    linhasMensagem.push(`• *Subtotal:* R$ ${calculatedSubtotal.toFixed(2).replace('.', ',')}`);
    if (desconto > 0) {
      linhasMensagem.push(`• *Desconto:* -R$ ${desconto.toFixed(2).replace('.', ',')} ${cliente.cupom ? `(Cupom: ${cliente.cupom})` : '(5% OFF no PIX)'}`);
    }
    if (cliente.tipoEntrega === 'delivery') {
      linhasMensagem.push(`• *Taxa de Entrega:* ${taxaEntrega === 0 ? 'GRÁTIS 🎉' : `R$ ${taxaEntrega.toFixed(2).replace('.', ',')}`}`);
    }
    linhasMensagem.push(`• *TOTAL DO PEDIDO:* *R$ ${totalCalculado.toFixed(2).replace('.', ',')}*`);

    linhasMensagem.push(`----------------------------------------`);
    linhasMensagem.push(`💳 *FORMA DE PAGAMENTO:*`);
    const pagamentoLabels: Record<string, string> = {
      pix: 'PIX (5% de Desconto aplicado)',
      cartao_credito: 'Cartão de Crédito (Levar maquininha)',
      cartao_debito: 'Cartão de Débito (Levar maquininha)',
      dinheiro: 'Dinheiro'
    };
    linhasMensagem.push(`• ${pagamentoLabels[cliente.formaPagamento] || cliente.formaPagamento}`);
    if (cliente.formaPagamento === 'dinheiro' && cliente.trocoPara) {
      const trocoCalculado = Math.max(0, cliente.trocoPara - totalCalculado);
      linhasMensagem.push(`• *Troco para:* R$ ${cliente.trocoPara.toFixed(2).replace('.', ',')} (Levar troco de R$ ${trocoCalculado.toFixed(2).replace('.', ',')})`);
    }

    linhasMensagem.push(`\n⏱️ *Tempo Estimado:* ${tempoEstimado}`);
    linhasMensagem.push(`\n_Obrigado por escolher a Pizzaria Gordeixo's! Forno a lenha desde 1986 em Brasília._`);

    const textoFormatado = linhasMensagem.join('\n');
    const textoEncoded = encodeURIComponent(textoFormatado);
    const linkWhatsApp = `https://api.whatsapp.com/send?phone=${PIZZARIA_WHATSAPP_PHONE}&text=${textoEncoded}`;

    const orderId = `ped_${orderTimestamp}_${randomSuffix}`;
    const requiresOnlinePayment = cliente.formaPagamento === 'pix' || cliente.formaPagamento === 'cartao_online';

    // Token secreto de pagamento — gerado no servidor, devolvido ao cliente uma
    // única vez. Obrigatório em /payments/pix/create, /payments/card/process,
    // /payments/status e /payments/simulate-paid.
    const paymentToken = requiresOnlinePayment ? crypto.randomUUID() : undefined;

    const orderData = {
      id: orderId,
      numeroPedido,
      createdAt: orderTimestamp,
      dataHora,
      subtotal: calculatedSubtotal,
      desconto,
      taxaEntrega,
      total: totalCalculado,
      cliente,
      itens: validatedItens,
      linkWhatsApp,
      textoFormatado,
      tempoEstimado,
      status: requiresOnlinePayment ? 'pending_payment' as const : 'recebido' as const,
      statusHistory: [{ status: requiresOnlinePayment ? 'pending_payment' as const : 'recebido' as const, timestamp: orderTimestamp, note: requiresOnlinePayment ? 'Aguardando confirmação do pagamento online' : 'Pedido criado no site' }],
      pixChave: PIX_CHAVE,
      pixQrPayload: `00020126580014br.gov.bcb.pix0136${PIX_CHAVE}520400005303986540${totalCalculado.toFixed(2)}5802BR5918GORDEIXOS PIZZARIA6008BRASILIA62070503***6304`,
      paymentToken
    };

    // Save in Restaurant Store for KDS
    const savedOrder = await restaurantStore.addOrder(orderData);

    return {
      sucesso: true,
      mensagem: requiresOnlinePayment ? 'Pedido criado. Aguardando confirmação do pagamento para entrar na cozinha.' : 'Pedido confirmado e enviado para a cozinha!',
      pedido: { ...savedOrder, paymentToken } as any
    };

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro interno ao processar pedido.';
    return {
      sucesso: false,
      mensagem: 'Ocorreu um erro ao processar o pedido. Tente novamente.',
      erro: errorMessage
    };
  }
};
