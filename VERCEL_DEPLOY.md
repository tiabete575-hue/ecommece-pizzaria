# Publicação na Vercel

Este projeto não precisa de um servidor Express separado. O frontend e a API são executados pelo próprio Next.js na Vercel; o banco continua no Supabase.

## Configuração do projeto

1. Envie este diretório para um repositório Git.
2. Importe o repositório na Vercel.
3. Confirme o framework `Next.js` e o gerenciador `pnpm`.
4. Não configure diretório de saída: a Vercel reconhece o Next.js automaticamente.

## Variáveis obrigatórias

Cadastre em **Project Settings > Environment Variables** para Production, Preview e Development:

- `APP_URL`: domínio público final, por exemplo `https://pedidos.suapizzaria.com.br`;
- `SUPABASE_PROJECT_REF`;
- `SUPABASE_URL`;
- `SUPABASE_ANON_KEY`;
- `SUPABASE_SERVICE_ROLE_KEY`;
- `PAYMENT_ACTIVE_GATEWAY=simulated`;
- `PAYMENT_SANDBOX_MODE=true`.

`SUPABASE_SERVICE_ROLE_KEY` é um segredo de servidor. Nunca acrescente `NEXT_PUBLIC_` ao nome e nunca a coloque no código-fonte.

## Pagamentos de demonstração

O gateway simulado continua disponível para apresentações. A seleção do gateway, o modo sandbox e as opções públicas ficam persistidos no Supabase, funcionando entre diferentes instâncias serverless.

Quando o cliente escolher um gateway real, cadastre as credenciais correspondentes diretamente nas variáveis protegidas da Vercel. O painel mascara os valores, mas não grava segredos no banco de dados.

Depois de cadastrar as variáveis ou alterar alguma credencial, faça um novo deployment. Para gateways reais, configure a URL de webhook como `https://SEU-DOMINIO/api/webhooks/NOME_DO_GATEWAY` e mantenha a validação de assinatura habilitada.
