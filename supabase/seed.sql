-- Local development seed. Production data should be managed through migrations/imports.

insert into public.stores (
  slug,
  name,
  legal_name,
  document,
  phone,
  whatsapp,
  timezone,
  address,
  settings
)
values (
  'gordeixos-brasilia',
  'Gordeixo''s Pizzaria',
  'Pizzaria Gordeixo''s Ltda.',
  '14.892.405/0001-86',
  '+5561999998686',
  '+5561999998686',
  'America/Sao_Paulo',
  '{"street":"CLN 302 Bloco B","unit":"Loja 14","neighborhood":"Asa Norte","city":"Brasília","state":"DF"}'::jsonb,
  '{"pickup_enabled":true,"delivery_enabled":true,"pix_discount_percent":5,"accepting_orders":true}'::jsonb
)
on conflict (slug) do update set
  name = excluded.name,
  legal_name = excluded.legal_name,
  document = excluded.document,
  phone = excluded.phone,
  whatsapp = excluded.whatsapp,
  address = excluded.address,
  settings = excluded.settings;

with store as (
  select id from public.stores where slug = 'gordeixos-brasilia'
)
insert into public.store_hours (store_id, day_of_week, opens_at, closes_at, is_closed)
select store.id, hours.day_of_week, hours.opens_at, hours.closes_at, hours.is_closed
from store
cross join (values
  (0::smallint, '18:00'::time, '23:00'::time, false),
  (1::smallint, null::time, null::time, true),
  (2::smallint, '18:00'::time, '23:00'::time, false),
  (3::smallint, '18:00'::time, '23:00'::time, false),
  (4::smallint, '18:00'::time, '23:00'::time, false),
  (5::smallint, '18:00'::time, '23:30'::time, false),
  (6::smallint, '18:00'::time, '23:30'::time, false)
) as hours(day_of_week, opens_at, closes_at, is_closed)
on conflict (store_id, day_of_week) do update set
  opens_at = excluded.opens_at,
  closes_at = excluded.closes_at,
  is_closed = excluded.is_closed;

with store as (
  select id from public.stores where slug = 'gordeixos-brasilia'
)
insert into public.categories (store_id, slug, name, icon, sort_order)
select store.id, category.slug, category.name, category.icon, category.sort_order
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
  sort_order = excluded.sort_order;

with store as (
  select id from public.stores where slug = 'gordeixos-brasilia'
)
insert into public.gateway_settings (store_id, provider, active, sandbox)
select store.id, provider.name, provider.active, true
from store
cross join (values
  ('simulated', true),
  ('mercadopago', false),
  ('efi_gerencianet', false),
  ('asaas', false),
  ('infinitepay', false)
) as provider(name, active)
on conflict (store_id, provider) do update set
  active = excluded.active,
  sandbox = excluded.sandbox;

