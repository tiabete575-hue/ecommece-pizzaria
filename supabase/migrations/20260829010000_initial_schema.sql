-- Gordeixo's Pizzaria - initial production schema
-- PostgreSQL / Supabase

create extension if not exists pgcrypto with schema extensions;

create sequence if not exists public.order_display_number_seq start with 1000;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null,
  legal_name text,
  document text,
  phone text,
  whatsapp text,
  email text,
  timezone text not null default 'America/Sao_Paulo',
  currency char(3) not null default 'BRL',
  address jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.store_hours (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  opens_at time,
  closes_at time,
  is_closed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, day_of_week),
  check (is_closed or (opens_at is not null and closes_at is not null))
);

create table public.staff_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('owner', 'admin', 'manager', 'kitchen', 'dispatcher', 'viewer')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.has_staff_role(required_roles text[] default array['owner','admin','manager','kitchen','dispatcher','viewer'])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_profiles staff
    where staff.user_id = auth.uid()
      and staff.active = true
      and staff.role = any(required_roles)
  );
$$;

revoke all on function public.has_staff_role(text[]) from public;
grant execute on function public.has_staff_role(text[]) to authenticated;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  icon text,
  sort_order integer not null default 0,
  active boolean not null default true,
  available_from time,
  available_until time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, slug)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  external_code text,
  slug text not null,
  name text not null,
  description text not null default '',
  product_type text not null default 'standard' check (product_type in ('standard', 'pizza', 'combo', 'beverage', 'service')),
  base_price numeric(12,2) not null default 0 check (base_price >= 0),
  image_url text,
  tags text[] not null default '{}',
  allergens text[] not null default '{}',
  dietary_flags text[] not null default '{}',
  popular boolean not null default false,
  featured boolean not null default false,
  active boolean not null default true,
  available boolean not null default true,
  track_stock boolean not null default false,
  stock_quantity integer check (stock_quantity is null or stock_quantity >= 0),
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, slug),
  unique (store_id, external_code)
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  external_code text,
  name text not null,
  description text,
  price numeric(12,2) not null check (price >= 0),
  slices smallint check (slices is null or slices > 0),
  sort_order integer not null default 0,
  active boolean not null default true,
  available boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, name),
  unique (product_id, external_code)
);

create table public.option_groups (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  slug text not null,
  name text not null,
  selection_type text not null default 'multiple' check (selection_type in ('single', 'multiple')),
  minimum_selections smallint not null default 0 check (minimum_selections >= 0),
  maximum_selections smallint check (maximum_selections is null or maximum_selections > 0),
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, slug),
  check (maximum_selections is null or maximum_selections >= minimum_selections)
);

create table public.product_options (
  id uuid primary key default gen_random_uuid(),
  option_group_id uuid not null references public.option_groups(id) on delete cascade,
  external_code text,
  name text not null,
  description text,
  price_delta numeric(12,2) not null default 0,
  sort_order integer not null default 0,
  active boolean not null default true,
  available boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (option_group_id, name),
  unique (option_group_id, external_code)
);

create table public.product_option_groups (
  product_id uuid not null references public.products(id) on delete cascade,
  option_group_id uuid not null references public.option_groups(id) on delete cascade,
  sort_order integer not null default 0,
  required boolean not null default false,
  configuration jsonb not null default '{}'::jsonb,
  primary key (product_id, option_group_id)
);

create table public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  slug text not null,
  name text not null,
  region text,
  delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0),
  minimum_order numeric(12,2) not null default 0 check (minimum_order >= 0),
  free_delivery_threshold numeric(12,2) check (free_delivery_threshold is null or free_delivery_threshold >= 0),
  estimated_minutes_min smallint not null check (estimated_minutes_min > 0),
  estimated_minutes_max smallint not null check (estimated_minutes_max >= estimated_minutes_min),
  postal_codes text[] not null default '{}',
  geojson jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, slug)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  full_name text not null,
  phone_e164 text not null,
  email text,
  marketing_opt_in boolean not null default false,
  marketing_opt_in_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (phone_e164)
);

create table public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  delivery_zone_id uuid references public.delivery_zones(id) on delete set null,
  label text,
  postal_code text,
  street text not null,
  number text,
  complement text,
  neighborhood text,
  city text not null default 'Brasília',
  state char(2) not null default 'DF',
  reference text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  code text not null,
  description text,
  discount_type text not null check (discount_type in ('percentage', 'fixed', 'free_delivery')),
  discount_value numeric(12,2) not null default 0 check (discount_value >= 0),
  minimum_order numeric(12,2) not null default 0 check (minimum_order >= 0),
  maximum_discount numeric(12,2) check (maximum_discount is null or maximum_discount >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  usage_limit_per_customer integer check (usage_limit_per_customer is null or usage_limit_per_customer > 0),
  first_order_only boolean not null default false,
  combinable boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, code),
  check (ends_at is null or starts_at is null or ends_at > starts_at),
  check (discount_type <> 'percentage' or discount_value <= 100)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  public_token uuid not null unique default gen_random_uuid(),
  display_number text not null unique default ('GDX-' || lpad(nextval('public.order_display_number_seq')::text, 6, '0')),
  store_id uuid not null references public.stores(id) on delete restrict,
  customer_id uuid references public.customers(id) on delete set null,
  delivery_zone_id uuid references public.delivery_zones(id) on delete set null,
  idempotency_key text,
  channel text not null default 'website' check (channel in ('website', 'admin', 'whatsapp', 'phone', 'marketplace')),
  fulfillment_type text not null check (fulfillment_type in ('delivery', 'pickup')),
  status text not null default 'pending_payment' check (status in (
    'draft', 'pending_payment', 'payment_failed', 'received', 'accepted', 'preparing',
    'ready_for_pickup', 'out_for_delivery', 'delivered', 'completed', 'cancelled'
  )),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'authorized', 'paid', 'failed', 'cancelled', 'partially_refunded', 'refunded')),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  delivery_address jsonb,
  subtotal numeric(12,2) not null check (subtotal >= 0),
  discount_total numeric(12,2) not null default 0 check (discount_total >= 0),
  delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0),
  total numeric(12,2) not null check (total >= 0),
  currency char(3) not null default 'BRL',
  coupon_code text,
  payment_method text check (payment_method in ('pix', 'credit_card_online', 'credit_card_on_delivery', 'debit_card_on_delivery', 'cash')),
  change_for numeric(12,2) check (change_for is null or change_for >= 0),
  customer_notes text,
  internal_notes text,
  estimated_ready_at timestamptz,
  accepted_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, idempotency_key),
  check (fulfillment_type = 'pickup' or delivery_address is not null),
  check (change_for is null or change_for >= total)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  variant_name text,
  quantity integer not null check (quantity > 0 and quantity <= 99),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  options_total numeric(12,2) not null default 0,
  line_total numeric(12,2) not null check (line_total >= 0),
  notes text,
  configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.order_item_options (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  option_id uuid references public.product_options(id) on delete set null,
  group_name text not null,
  option_name text not null,
  quantity integer not null default 1 check (quantity > 0 and quantity <= 99),
  unit_price numeric(12,2) not null default 0,
  total_price numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete restrict,
  order_id uuid not null unique references public.orders(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  discount_amount numeric(12,2) not null check (discount_amount >= 0),
  redeemed_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  idempotency_key text not null,
  provider text not null,
  provider_transaction_id text,
  method text not null check (method in ('pix', 'credit_card', 'debit_card', 'cash')),
  status text not null default 'pending' check (status in ('pending', 'authorized', 'paid', 'failed', 'cancelled', 'expired', 'partially_refunded', 'refunded')),
  amount numeric(12,2) not null check (amount > 0),
  refunded_amount numeric(12,2) not null default 0 check (refunded_amount >= 0 and refunded_amount <= amount),
  currency char(3) not null default 'BRL',
  installments smallint not null default 1 check (installments between 1 and 24),
  payment_link text,
  pix_copy_paste text,
  pix_expires_at timestamptz,
  card_brand text,
  card_last4 char(4),
  failure_code text,
  failure_message text,
  metadata jsonb not null default '{}'::jsonb,
  authorized_at timestamptz,
  paid_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, idempotency_key),
  unique (provider, provider_transaction_id)
);

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references public.payments(id) on delete cascade,
  provider text not null,
  provider_event_id text,
  event_type text not null,
  signature_valid boolean not null default false,
  payload jsonb not null,
  processing_status text not null default 'received' check (processing_status in ('received', 'processed', 'ignored', 'failed')),
  processing_error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, provider_event_id)
);

create table public.drivers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  full_name text not null,
  phone text,
  vehicle_type text,
  vehicle_plate text,
  active boolean not null default true,
  available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  driver_id uuid references public.drivers(id) on delete set null,
  status text not null default 'waiting' check (status in ('waiting', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed', 'cancelled')),
  assigned_at timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz,
  proof jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_status_history (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references auth.users(id) on delete set null,
  source text not null default 'system' check (source in ('system', 'customer', 'staff', 'gateway', 'integration')),
  note text,
  created_at timestamptz not null default now()
);

create table public.gateway_settings (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  provider text not null,
  active boolean not null default false,
  sandbox boolean not null default true,
  public_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, provider)
);

comment on table public.gateway_settings is 'Non-secret gateway configuration only. Credentials must live in protected environment variables or a secrets manager.';

create table public.audit_logs (
  id bigint generated always as identity primary key,
  store_id uuid references public.stores(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index idx_categories_store_sort on public.categories(store_id, active, sort_order);
create index idx_products_catalog on public.products(store_id, category_id, active, available, sort_order);
create index idx_product_variants_product on public.product_variants(product_id, active, available, sort_order);
create index idx_product_options_group on public.product_options(option_group_id, active, available, sort_order);
create index idx_delivery_zones_store on public.delivery_zones(store_id, active);
create index idx_customers_phone on public.customers(phone_e164);
create index idx_orders_store_created on public.orders(store_id, created_at desc);
create index idx_orders_kds on public.orders(store_id, status, created_at);
create index idx_orders_customer on public.orders(customer_id, created_at desc);
create index idx_order_items_order on public.order_items(order_id);
create index idx_order_item_options_item on public.order_item_options(order_item_id);
create index idx_payments_order on public.payments(order_id, created_at desc);
create index idx_payment_events_payment on public.payment_events(payment_id, received_at desc);
create index idx_order_history_order on public.order_status_history(order_id, created_at);
create index idx_deliveries_driver_status on public.deliveries(driver_id, status);
create index idx_audit_store_created on public.audit_logs(store_id, created_at desc);

create trigger stores_set_updated_at before update on public.stores for each row execute function public.set_updated_at();
create trigger store_hours_set_updated_at before update on public.store_hours for each row execute function public.set_updated_at();
create trigger staff_profiles_set_updated_at before update on public.staff_profiles for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger product_variants_set_updated_at before update on public.product_variants for each row execute function public.set_updated_at();
create trigger option_groups_set_updated_at before update on public.option_groups for each row execute function public.set_updated_at();
create trigger product_options_set_updated_at before update on public.product_options for each row execute function public.set_updated_at();
create trigger delivery_zones_set_updated_at before update on public.delivery_zones for each row execute function public.set_updated_at();
create trigger customers_set_updated_at before update on public.customers for each row execute function public.set_updated_at();
create trigger customer_addresses_set_updated_at before update on public.customer_addresses for each row execute function public.set_updated_at();
create trigger coupons_set_updated_at before update on public.coupons for each row execute function public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders for each row execute function public.set_updated_at();
create trigger payments_set_updated_at before update on public.payments for each row execute function public.set_updated_at();
create trigger drivers_set_updated_at before update on public.drivers for each row execute function public.set_updated_at();
create trigger deliveries_set_updated_at before update on public.deliveries for each row execute function public.set_updated_at();
create trigger gateway_settings_set_updated_at before update on public.gateway_settings for each row execute function public.set_updated_at();

create or replace function public.record_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    insert into public.order_status_history(order_id, from_status, to_status, changed_by, source)
    values (
      new.id,
      old.status,
      new.status,
      auth.uid(),
      case when auth.uid() is null then 'system' else 'staff' end
    );
  end if;
  return new;
end;
$$;

create trigger orders_record_status_change
after update of status on public.orders
for each row execute function public.record_order_status_change();

alter table public.stores enable row level security;
alter table public.store_hours enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.option_groups enable row level security;
alter table public.product_options enable row level security;
alter table public.product_option_groups enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.customers enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_item_options enable row level security;
alter table public.coupon_redemptions enable row level security;
alter table public.payments enable row level security;
alter table public.payment_events enable row level security;
alter table public.drivers enable row level security;
alter table public.deliveries enable row level security;
alter table public.order_status_history enable row level security;
alter table public.gateway_settings enable row level security;
alter table public.audit_logs enable row level security;

create policy public_read_active_stores on public.stores for select to anon, authenticated using (is_active);
create policy public_read_store_hours on public.store_hours for select to anon, authenticated using (
  exists (select 1 from public.stores s where s.id = store_id and s.is_active)
);
create policy public_read_categories on public.categories for select to anon, authenticated using (active);
create policy public_read_products on public.products for select to anon, authenticated using (active and available);
create policy public_read_variants on public.product_variants for select to anon, authenticated using (
  active and available and exists (
    select 1 from public.products p where p.id = product_id and p.active and p.available
  )
);
create policy public_read_option_groups on public.option_groups for select to anon, authenticated using (active);
create policy public_read_product_options on public.product_options for select to anon, authenticated using (active and available);
create policy public_read_product_option_groups on public.product_option_groups for select to anon, authenticated using (
  exists (select 1 from public.products p where p.id = product_id and p.active and p.available)
);
create policy public_read_delivery_zones on public.delivery_zones for select to anon, authenticated using (active);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'stores', 'store_hours', 'staff_profiles', 'categories', 'products', 'product_variants',
    'option_groups', 'product_options', 'product_option_groups', 'delivery_zones', 'customers',
    'customer_addresses', 'coupons', 'orders', 'order_items', 'order_item_options',
    'coupon_redemptions', 'drivers', 'deliveries', 'order_status_history'
  ]
  loop
    execute format(
      'create policy staff_select on public.%I for select to authenticated using (public.has_staff_role())',
      table_name
    );
  end loop;

  foreach table_name in array array[
    'stores', 'store_hours', 'categories', 'products', 'product_variants',
    'option_groups', 'product_options', 'product_option_groups', 'delivery_zones', 'coupons',
    'gateway_settings'
  ]
  loop
    execute format(
      'create policy administrators_manage on public.%I for all to authenticated using (public.has_staff_role(array[''owner'',''admin'',''manager''])) with check (public.has_staff_role(array[''owner'',''admin'',''manager'']))',
      table_name
    );
  end loop;

  foreach table_name in array array['customers', 'customer_addresses']
  loop
    execute format(
      'create policy operations_manage on public.%I for all to authenticated using (public.has_staff_role(array[''owner'',''admin'',''manager'',''dispatcher''])) with check (public.has_staff_role(array[''owner'',''admin'',''manager'',''dispatcher'']))',
      table_name
    );
  end loop;

  foreach table_name in array array['orders', 'order_items', 'order_item_options', 'order_status_history']
  loop
    execute format(
      'create policy order_operations_manage on public.%I for all to authenticated using (public.has_staff_role(array[''owner'',''admin'',''manager'',''kitchen'',''dispatcher''])) with check (public.has_staff_role(array[''owner'',''admin'',''manager'',''kitchen'',''dispatcher'']))',
      table_name
    );
  end loop;

  foreach table_name in array array['drivers', 'deliveries']
  loop
    execute format(
      'create policy delivery_operations_manage on public.%I for all to authenticated using (public.has_staff_role(array[''owner'',''admin'',''manager'',''dispatcher''])) with check (public.has_staff_role(array[''owner'',''admin'',''manager'',''dispatcher'']))',
      table_name
    );
  end loop;
end $$;

create policy staff_profiles_manage on public.staff_profiles for all to authenticated
using (public.has_staff_role(array['owner','admin']))
with check (public.has_staff_role(array['owner','admin']));

create policy finance_select on public.payments for select to authenticated
using (public.has_staff_role(array['owner','admin','manager']));
create policy finance_manage on public.payments for all to authenticated
using (public.has_staff_role(array['owner','admin','manager']))
with check (public.has_staff_role(array['owner','admin','manager']));

create policy payment_events_select on public.payment_events for select to authenticated
using (public.has_staff_role(array['owner','admin','manager']));
create policy payment_events_manage on public.payment_events for all to authenticated
using (public.has_staff_role(array['owner','admin','manager']))
with check (public.has_staff_role(array['owner','admin','manager']));

create policy coupon_redemptions_select on public.coupon_redemptions for select to authenticated
using (public.has_staff_role(array['owner','admin','manager']));
create policy coupon_redemptions_manage on public.coupon_redemptions for all to authenticated
using (public.has_staff_role(array['owner','admin','manager']))
with check (public.has_staff_role(array['owner','admin','manager']));

create policy gateway_settings_select on public.gateway_settings for select to authenticated
using (public.has_staff_role(array['owner','admin','manager']));

create policy audit_logs_select on public.audit_logs for select to authenticated
using (public.has_staff_role(array['owner','admin']));
create policy audit_logs_insert on public.audit_logs for insert to authenticated
with check (public.has_staff_role());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu-images',
  'menu-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy public_read_menu_images
on storage.objects for select
to anon, authenticated
using (bucket_id = 'menu-images');

create policy staff_insert_menu_images
on storage.objects for insert
to authenticated
with check (bucket_id = 'menu-images' and public.has_staff_role(array['owner','admin','manager']));

create policy staff_update_menu_images
on storage.objects for update
to authenticated
using (bucket_id = 'menu-images' and public.has_staff_role(array['owner','admin','manager']))
with check (bucket_id = 'menu-images' and public.has_staff_role(array['owner','admin','manager']));

create policy staff_delete_menu_images
on storage.objects for delete
to authenticated
using (bucket_id = 'menu-images' and public.has_staff_role(array['owner','admin','manager']));

alter table public.orders replica identity full;
alter table public.order_status_history replica identity full;
alter table public.payments replica identity full;
alter table public.deliveries replica identity full;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders') then
      alter publication supabase_realtime add table public.orders;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'order_status_history') then
      alter publication supabase_realtime add table public.order_status_history;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'payments') then
      alter publication supabase_realtime add table public.payments;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'deliveries') then
      alter publication supabase_realtime add table public.deliveries;
    end if;
  end if;
end $$;
