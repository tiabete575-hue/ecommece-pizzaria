# Implementação de segurança e persistência

## O que foi corrigido

1. **Painel administrativo:** o PIN fixo no navegador foi removido. O login usa Supabase Authentication e todas as rotas `/api/admin/*` validam a sessão e o perfil ativo da equipe no servidor.
2. **Persistência:** cardápio, variações, adicionais, cupons, bairros, pedidos e transações são gravados no Supabase. A memória do processo é apenas um cache recarregado do banco ao iniciar.
3. **Rotas:** pagamentos e webhooks deixaram de receber o segundo prefixo `/api` dentro do roteador. As URLs públicas continuam sendo `/api/payments/*` e `/api/webhooks/*`.
4. **Cartão demonstrativo:** número completo e CVV não são enviados ao backend. O frontend cria um token de demonstração e envia somente bandeira, quatro últimos dígitos e parcelas. Fora do sandbox, o backend recusa cartão até existir tokenização oficial do gateway.
5. **Webhooks:** Mercado Pago valida `x-signature` com HMAC-SHA256 e tolerância de cinco minutos; Asaas valida `asaas-access-token`. EFI e InfinitePay permanecem bloqueados até a forma oficial de autenticação ser configurada para o contrato escolhido.
6. **Cozinha:** PIX e cartão online criam pedidos em `pending_payment`; esses pedidos não aparecem no KDS. A confirmação do pagamento muda o pedido para `received`/`recebido`.
7. **Preços:** produto, tamanho, segundo sabor, borda, adicional, cupom, entrega, desconto e total são recalculados no servidor. Valores e nomes enviados pelo navegador não são aceitos como fonte de cobrança.
8. **Produtos pausados:** a API pública entrega somente produtos, bordas e adicionais disponíveis.
9. **Cupons:** destaques promocionais, carrinho, checkout e painel usam a mesma lista fornecida pelo banco.

## Modo demonstração de pagamentos

Configure no backend:

```env
PAYMENT_ACTIVE_GATEWAY="simulated"
PAYMENT_SANDBOX_MODE="true"
```

Nesse modo, PIX e cartão podem ser aprovados para apresentação comercial. Nenhuma operação financeira real é realizada. O modo deve ser identificado como demonstração na interface e nunca deve ser usado para aceitar pagamentos reais.

## Primeiro usuário administrativo

1. Crie o usuário em Supabase > Authentication > Users.
2. Copie o UUID do usuário.
3. Cadastre esse UUID em `public.staff_profiles`, associado à loja `gordeixos-brasilia`.
4. Use um dos papéis: `owner`, `admin`, `manager`, `kitchen`, `dispatcher` ou `viewer`.

Exemplo para executar no SQL Editor, substituindo o UUID e o nome:

```sql
insert into public.staff_profiles (user_id, store_id, full_name, role, active)
select
  'UUID_DO_USUARIO'::uuid,
  stores.id,
  'Nome do responsável',
  'owner',
  true
from public.stores
where stores.slug = 'gordeixos-brasilia';
```

## Validações executadas

- TypeScript sem erros com `tsc --noEmit`.
- Migrações aplicadas no projeto `kmxskknkdceviavccnpo`.
- `supabase db lint`: nenhum erro de esquema.
- Login real temporário: autenticou e acessou rota protegida; usuário de teste removido depois.
- Requisição anônima ao painel: HTTP 401.
- Tentativa de preço de item em R$ 0,01: servidor recalculou R$ 59,80.
- Tentativa de adicional em R$ 0,01: servidor aplicou R$ 6,90.
- Tentativa de cobrança em R$ 0,01: servidor cobrou o total oficial de R$ 56,81.
- Pedido online permaneceu em `pending_payment` e fora da cozinha; após aprovação demonstrativa, passou para `recebido`.
- Registros e usuário temporários usados nos testes foram removidos.
