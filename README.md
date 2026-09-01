# Gordeixo's Pizzaria

E-commerce completo para pizzaria, migrado para Next.js com frontend e API no mesmo projeto. O Supabase mantém cardápio, pedidos, cupons, regiões de entrega, equipe administrativa e transações.

## Estrutura

- `app/`: aplicação Next.js e rotas HTTP em `/api`;
- `src/`: interface da loja e do painel administrativo;
- `server/`: regras de negócio, persistência e pagamentos;
- `supabase/migrations/`: estrutura versionada do banco de dados.

## Executar localmente

1. Copie `.env.example` para `.env.local` e preencha as chaves do Supabase.
2. Instale as dependências com `pnpm install`.
3. Inicie com `pnpm dev`.
4. Acesse `http://localhost:3000`.

## Verificações

- `pnpm lint`: valida os tipos TypeScript;
- `pnpm build`: gera a versão de produção.

O modo de pagamento padrão é `simulated`, adequado para demonstrações. As cobranças usam sempre o total recalculado e armazenado no servidor. Pedidos online permanecem como `pending_payment` e só entram na cozinha depois da aprovação simulada ou confirmação válida do gateway.

Consulte `VERCEL_DEPLOY.md` para publicar.
