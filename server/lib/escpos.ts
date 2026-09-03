/**
 * Gerador ESC/POS — Protocolo universal para impressoras térmicas.
 * Zero dependências externas. Suporta 80mm e 58mm.
 *
 * Referência do protocolo:
 *  ESC @ (1B 40)      — Inicializar impressora
 *  ESC ! n (1B 21)    — Configuração de fonte (bold, double, etc.)
 *  ESC a n (1B 61)    — Alinhamento: 0=esq, 1=centro, 2=dir
 *  GS ! n (1D 21)     — Tamanho do caractere (ampliado)
 *  GS V m (1D 56)     — Corte de papel: 0=completo, 1=parcial
 *  LF (0A)            — Avançar linha
 */

import type { KitchenOrder, OrderItemPayload } from '../../src/types/index.ts';

// ── Constantes ESC/POS ─────────────────────────────────────────────────────

const ESC = 0x1b;
const GS  = 0x1d;
const LF  = 0x0a;

// Comandos compostos
const INIT        = Buffer.from([ESC, 0x40]);               // ESC @
const ALIGN_LEFT  = Buffer.from([ESC, 0x61, 0x00]);         // ESC a 0
const ALIGN_CTR   = Buffer.from([ESC, 0x61, 0x01]);         // ESC a 1
const BOLD_ON     = Buffer.from([ESC, 0x45, 0x01]);         // ESC E 1
const BOLD_OFF    = Buffer.from([ESC, 0x45, 0x00]);         // ESC E 0
const DBLW_ON     = Buffer.from([ESC, 0x21, 0x20]);         // ESC ! 0x20 (double width)
const DBLW_OFF    = Buffer.from([ESC, 0x21, 0x00]);         // ESC ! 0 (normal)
const SIZE_2X     = Buffer.from([GS,  0x21, 0x11]);         // GS ! 0x11 (2x width+height)
const SIZE_NORMAL = Buffer.from([GS,  0x21, 0x00]);         // GS ! 0 (normal)
const CUT_PARTIAL = Buffer.from([GS,  0x56, 0x01]);         // GS V 1 (corte parcial)
const CUT_FULL    = Buffer.from([GS,  0x56, 0x00]);         // GS V 0 (corte completo)
const FEED_3      = Buffer.from([ESC, 0x64, 0x03]);         // ESC d 3 (avança 3 linhas)

// ── Helpers ────────────────────────────────────────────────────────────────

/** Converte string para Buffer latin1 (compatível com a maioria das impressoras BR) */
function str(text: string): Buffer {
  // Substitui caracteres especiais não suportados em latin1 básico
  const normalized = text
    .replace(/[áàâã]/g, 'a').replace(/[ÁÀÂÃ]/g, 'A')
    .replace(/[éèê]/g,  'e').replace(/[ÉÈÊ]/g,  'E')
    .replace(/[íì]/g,   'i').replace(/[ÍÌ]/g,   'I')
    .replace(/[óòôõ]/g, 'o').replace(/[ÓÒÔÕ]/g, 'O')
    .replace(/[úù]/g,   'u').replace(/[ÚÙ]/g,   'U')
    .replace(/ç/g, 'c').replace(/Ç/g, 'C')
    .replace(/ñ/g, 'n').replace(/Ñ/g, 'N');
  return Buffer.from(normalized, 'latin1');
}

/** Linha simples com newline */
function line(text: string = ''): Buffer {
  return Buffer.concat([str(text), Buffer.from([LF])]);
}

/** Linha divisória */
function divider(char = '-', width = 48): Buffer {
  return line(char.repeat(width));
}

/** Formata valor monetário BRL */
function brl(value: number): string {
  return `R$ ${(value ?? 0).toFixed(2).replace('.', ',')}`;
}

/** Linha com texto à esquerda e valor à direita, preenchendo com espaços */
function lineKeyVal(key: string, val: string, totalWidth = 48): Buffer {
  const spaces = Math.max(1, totalWidth - key.length - val.length);
  return line(`${key}${' '.repeat(spaces)}${val}`);
}

/** Quebra texto longo em linhas de até `width` chars */
function wrapText(text: string, width: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length <= width) {
      current = (current + ' ' + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ── Builders principais ────────────────────────────────────────────────────

/**
 * Comanda para a COZINHA — sem valores financeiros, fonte grande, itens claros.
 * Enviada automaticamente ao receber um novo pedido.
 */
export function buildKitchenTicket(order: KitchenOrder, paperWidth: '80mm' | '58mm', autoCut: boolean): Buffer {
  const colWidth = paperWidth === '80mm' ? 48 : 32;
  const parts: Buffer[] = [];

  // Inicialização
  parts.push(INIT);

  // === CABEÇALHO ===
  parts.push(ALIGN_CTR);
  parts.push(BOLD_ON);
  parts.push(SIZE_2X);
  parts.push(line('COZINHA / FORNO'));
  parts.push(SIZE_NORMAL);
  parts.push(BOLD_OFF);
  parts.push(divider('=', colWidth));

  // Número do pedido — grande e destacado
  parts.push(ALIGN_CTR);
  parts.push(BOLD_ON);
  parts.push(SIZE_2X);
  parts.push(line(order.numeroPedido));
  parts.push(SIZE_NORMAL);
  parts.push(BOLD_OFF);

  // Tipo de entrega
  const tipoLabel = order.cliente.tipoEntrega === 'delivery'
    ? '*** ENTREGA DELIVERY ***'
    : '*** RETIRADA BALCAO ***';
  parts.push(BOLD_ON);
  parts.push(line(tipoLabel));
  parts.push(BOLD_OFF);
  parts.push(line(`Horario: ${order.dataHora}`));
  parts.push(divider('-', colWidth));

  // === ITENS DO PEDIDO ===
  parts.push(ALIGN_LEFT);
  parts.push(BOLD_ON);
  parts.push(line(`ITENS (${order.itens.length}):`));
  parts.push(BOLD_OFF);
  parts.push(divider('-', colWidth));

  for (const item of order.itens) {
    parts.push(BOLD_ON);
    parts.push(DBLW_ON);
    parts.push(line(`${item.quantity}x ${item.name}`));
    parts.push(DBLW_OFF);
    parts.push(BOLD_OFF);

    if (item.isHalfHalf && item.secondFlavorName) {
      parts.push(line(`  + Meio a Meio: ${item.secondFlavorName}`));
    }
    if (item.sizeName) {
      parts.push(line(`  Tamanho: ${item.sizeName}`));
    }
    if (item.crustName && item.crustName !== 'Massa Tradicional (Sem recheio extra)') {
      parts.push(BOLD_ON);
      parts.push(line(`  BORDA: ${item.crustName}`));
      parts.push(BOLD_OFF);
    }
    if (item.extras && item.extras.length > 0) {
      parts.push(line(`  Extras: ${item.extras.map(e => e.name).join(', ')}`));
    }
    if (item.observations) {
      parts.push(BOLD_ON);
      parts.push(line(`  !! OBS: ${item.observations}`));
      parts.push(BOLD_OFF);
    }
    parts.push(line());
  }

  parts.push(divider('=', colWidth));

  // Tempo estimado
  parts.push(ALIGN_CTR);
  parts.push(line(`Tempo estimado: ${order.tempoEstimado}`));

  // Feed e corte
  parts.push(FEED_3);
  if (autoCut) {
    parts.push(CUT_PARTIAL);
  }

  return Buffer.concat(parts);
}

/**
 * Cupom completo para o BALCÃO — com valores, pagamento, endereço.
 */
export function buildCounterReceipt(order: KitchenOrder, paperWidth: '80mm' | '58mm', autoCut: boolean): Buffer {
  const colWidth = paperWidth === '80mm' ? 48 : 32;
  const parts: Buffer[] = [];

  // Inicialização
  parts.push(INIT);

  // === CABEÇALHO ===
  parts.push(ALIGN_CTR);
  parts.push(BOLD_ON);
  parts.push(SIZE_2X);
  parts.push(line("GORDEIXO'S PIZZARIA"));
  parts.push(SIZE_NORMAL);
  parts.push(BOLD_OFF);
  parts.push(line('TRADICAO DE BRASILIA - DESDE 1986'));
  parts.push(line('CLN 302 Bloco B - Asa Norte, DF'));
  parts.push(line('WhatsApp: (61) 99999-8686'));
  parts.push(divider('=', colWidth));

  // Número do pedido
  parts.push(ALIGN_CTR);
  parts.push(BOLD_ON);
  parts.push(SIZE_2X);
  parts.push(line(order.numeroPedido));
  parts.push(SIZE_NORMAL);
  parts.push(BOLD_OFF);

  const tipoLabel = order.cliente.tipoEntrega === 'delivery'
    ? 'ENTREGA DELIVERY'
    : 'RETIRADA BALCAO';
  parts.push(line(tipoLabel));
  parts.push(line(`Data/Hora: ${order.dataHora}`));
  parts.push(divider('-', colWidth));

  // === CLIENTE ===
  parts.push(ALIGN_LEFT);
  parts.push(BOLD_ON);
  parts.push(line('CLIENTE:'));
  parts.push(BOLD_OFF);
  parts.push(line(order.cliente.nome));
  parts.push(line(`Tel: ${order.cliente.whatsapp}`));

  if (order.cliente.tipoEntrega === 'delivery') {
    parts.push(line());
    parts.push(BOLD_ON);
    parts.push(line('ENDERECO:'));
    parts.push(BOLD_OFF);
    if (order.cliente.bairroNome) parts.push(line(order.cliente.bairroNome));
    if (order.cliente.cep) parts.push(line(`CEP: ${order.cliente.cep}`));
    const endereco = [
      order.cliente.endereco,
      order.cliente.numero ? `n ${order.cliente.numero}` : '',
      order.cliente.complemento || ''
    ].filter(Boolean).join(', ');
    if (endereco) parts.push(line(endereco));
    if (order.cliente.referencia) parts.push(line(`Ref: ${order.cliente.referencia}`));
  }

  parts.push(divider('-', colWidth));

  // === ITENS ===
  parts.push(BOLD_ON);
  parts.push(line('ITENS DO PEDIDO:'));
  parts.push(BOLD_OFF);
  parts.push(divider('-', colWidth));

  for (const item of order.itens) {
    const itemTotal = (item.unitPrice ?? 0) * (item.quantity ?? 1);
    parts.push(BOLD_ON);
    parts.push(lineKeyVal(`${item.quantity}x ${item.name}`, brl(itemTotal), colWidth));
    parts.push(BOLD_OFF);

    if (item.isHalfHalf && item.secondFlavorName) {
      parts.push(line(`  1/2 ${item.secondFlavorName}`));
    }
    if (item.sizeName) {
      parts.push(line(`  ${item.sizeName}`));
    }
    if (item.crustName && item.crustName !== 'Massa Tradicional (Sem recheio extra)') {
      parts.push(line(`  Borda: ${item.crustName}`));
    }
    if (item.extras && item.extras.length > 0) {
      parts.push(line(`  Extras: ${item.extras.map(e => e.name).join(', ')}`));
    }
    if (item.observations) {
      parts.push(BOLD_ON);
      parts.push(line(`  OBS: ${item.observations}`));
      parts.push(BOLD_OFF);
    }
  }

  parts.push(divider('=', colWidth));

  // === TOTAIS ===
  parts.push(lineKeyVal('Subtotal:', brl(order.subtotal ?? 0), colWidth));
  if ((order.desconto ?? 0) > 0) {
    parts.push(lineKeyVal('Desconto:', `-${brl(order.desconto ?? 0)}`, colWidth));
  }
  if (order.cliente.tipoEntrega === 'delivery') {
    const frete = (order.taxaEntrega ?? 0) === 0 ? 'GRATIS' : brl(order.taxaEntrega ?? 0);
    parts.push(lineKeyVal('Taxa de Entrega:', frete, colWidth));
  }

  parts.push(divider('-', colWidth));
  parts.push(BOLD_ON);
  parts.push(SIZE_2X);
  parts.push(lineKeyVal('TOTAL:', brl(order.total ?? 0), colWidth / 2));
  parts.push(SIZE_NORMAL);
  parts.push(BOLD_OFF);
  parts.push(divider('-', colWidth));

  // === PAGAMENTO ===
  const paymentLabels: Record<string, string> = {
    pix: 'PIX',
    cartao_credito: 'CARTAO CREDITO',
    cartao_debito: 'CARTAO DEBITO',
    dinheiro: 'DINHEIRO',
    cartao_online: 'CARTAO ONLINE'
  };
  const payLabel = paymentLabels[order.cliente.formaPagamento] ?? order.cliente.formaPagamento.toUpperCase();
  parts.push(BOLD_ON);
  parts.push(line(`PAGAMENTO: ${payLabel}`));
  parts.push(BOLD_OFF);

  if (order.cliente.formaPagamento === 'dinheiro' && order.cliente.trocoPara) {
    const troco = (order.cliente.trocoPara ?? 0) - (order.total ?? 0);
    parts.push(line(`Troco para: ${brl(order.cliente.trocoPara ?? 0)}`));
    parts.push(BOLD_ON);
    parts.push(line(`Troco a dar: ${brl(troco)}`));
    parts.push(BOLD_OFF);
  }

  parts.push(divider('=', colWidth));

  // === RODAPÉ ===
  parts.push(ALIGN_CTR);
  parts.push(line(`Estimativa: ${order.tempoEstimado}`));
  parts.push(line());
  parts.push(line("Gordeixo's Pizzaria agradece!"));
  parts.push(line('Nos avalie no Google Maps :)'));

  // Feed e corte
  parts.push(FEED_3);
  if (autoCut) {
    parts.push(CUT_PARTIAL);
  }

  return Buffer.concat(parts);
}

/**
 * Página de teste — imprime informações básicas para verificar conectividade.
 */
export function buildTestPage(printerName: string, paperWidth: '80mm' | '58mm', autoCut: boolean): Buffer {
  const colWidth = paperWidth === '80mm' ? 48 : 32;
  const parts: Buffer[] = [];

  parts.push(INIT);
  parts.push(ALIGN_CTR);
  parts.push(BOLD_ON);
  parts.push(SIZE_2X);
  parts.push(line('TESTE OK!'));
  parts.push(SIZE_NORMAL);
  parts.push(BOLD_OFF);
  parts.push(divider('-', colWidth));
  parts.push(line(`Impressora: ${printerName}`));
  parts.push(line(`Largura: ${paperWidth}`));
  parts.push(line(`Corte auto: ${autoCut ? 'SIM' : 'NAO'}`));
  parts.push(line(`Protocolo: ESC/POS`));
  parts.push(line(new Date().toLocaleString('pt-BR')));
  parts.push(divider('-', colWidth));
  parts.push(line('Gordeixos Pizzaria'));
  parts.push(line('Sistema de Impressao Termica'));
  parts.push(FEED_3);
  if (autoCut) parts.push(CUT_PARTIAL);

  return Buffer.concat(parts);
}
