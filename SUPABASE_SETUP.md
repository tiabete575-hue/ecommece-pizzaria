# Supabase — configuração do projeto Gordeixo's

Projeto Supabase vinculado: `kmxskknkdceviavccnpo`

## Estado atual

- CLI inicializada e projeto remoto vinculado.
- Migrações de estrutura e fundação operacional aplicadas ao banco remoto.
- Row Level Security (RLS) habilitado nas tabelas públicas.
- Banco validado com `supabase db lint`: nenhum erro de esquema.
- Migrações local e remota sincronizadas.

## Estrutura criada

- Loja e horários de funcionamento.
- Equipe administrativa e perfis de acesso.
- Categorias, produtos, tamanhos/variações e adicionais.
- Áreas e taxas de entrega.
- Clientes e endereços.
- Cupons e resgates.
- Pedidos, itens, adicionais e histórico de status.
- Pagamentos e eventos recebidos dos gateways.
- Entregadores e entregas.
- Configuração de gateways sem armazenamento de chaves secretas.
- Auditoria de operações administrativas.
- Bucket público `menu-images` para imagens do cardápio.
- Atualizações em tempo real para pedidos, pagamentos e entregas.

## Arquivos importantes

- `supabase/config.toml`: configuração local e regras de autenticação.
- `supabase/migrations/20260829010000_initial_schema.sql`: estrutura versionada do banco.
- `supabase/seed.sql`: dados demonstrativos opcionais para desenvolvimento local.

## Variáveis da aplicação

O frontend deverá receber somente valores públicos:

```env
VITE_SUPABASE_URL=https://kmxskknkdceviavccnpo.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key-do-painel>
```

O backend poderá usar a chave de serviço, armazenada apenas no servidor:

```env
SUPABASE_URL=https://kmxskknkdceviavccnpo.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key-do-painel>
```

Nunca colocar `SUPABASE_SERVICE_ROLE_KEY`, senhas do banco ou segredos de gateways no frontend ou no Git.

## Primeira configuração operacional

1. Cadastrar os dados reais da pizzaria em `stores` e `store_hours`.
2. Criar o primeiro usuário em Authentication > Users.
3. Cadastrar o UUID desse usuário em `staff_profiles`, associado à loja, com papel `owner`.
4. Cadastrar categorias, produtos, variações, adicionais e áreas de entrega.
5. Definir o gateway escolhido e manter as credenciais secretas no ambiente do backend.

O arquivo `seed.sql` não foi executado no banco de produção porque contém dados demonstrativos do protótipo. Ele pode ser ajustado e aplicado depois que os dados oficiais da pizzaria forem confirmados.

## Integração da aplicação

O backend já utiliza o Supabase como fonte oficial para catálogo, cupons, regiões, pedidos e transações. Cálculos finais, descontos, pagamentos, webhooks e ações administrativas ficam concentrados no servidor. Consulte `IMPLEMENTACAO_SEGURANCA.md` para o fluxo atualizado e os testes executados.
