alter table public.orders
  add column if not exists metadata jsonb not null default '{}'::jsonb;

insert into public.stores (slug, name, timezone, currency, settings, is_active)
values (
  'gordeixos-brasilia',
  'Gordeixo''s Pizzaria',
  'America/Sao_Paulo',
  'BRL',
  '{"pickup_enabled":true,"delivery_enabled":true,"pix_discount_percent":5,"accepting_orders":true,"demo_payments_enabled":true}'::jsonb,
  true
)
on conflict (slug) do update set
  name = excluded.name,
  settings = public.stores.settings || excluded.settings,
  is_active = true;

with store as (
  select id from public.stores where slug = 'gordeixos-brasilia'
)
insert into public.categories (store_id, slug, name, icon, sort_order, active)
select store.id, category.slug, category.name, category.icon, category.sort_order, true
from store
cross join (values
  ('tradicionais', 'Pizzas Tradicionais', 'Pizza', 10),
  ('especiais', 'Pizzas Especiais', 'Sparkles', 20),
  ('doces', 'Pizzas Doces', 'Cake', 30),
  ('parmegianas', 'Parmegianas de Brasília', 'Flame', 40),
  ('combos', 'Combos & Promoções', 'Gift', 50),
  ('bebidas', 'Bebidas Geladas', 'Wine', 60)
) as category(slug, name, icon, sort_order)
on conflict (store_id, slug) do update set
  name = excluded.name,
  icon = excluded.icon,
  sort_order = excluded.sort_order,
  active = true;

create index if not exists idx_products_store_external_code
  on public.products(store_id, external_code);

create index if not exists idx_orders_store_created_at
  on public.orders(store_id, created_at desc);
