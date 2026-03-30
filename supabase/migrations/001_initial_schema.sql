-- ============================================================
-- Make It Easy — Initial Schema
-- Region: eu-central-1 (Frankfurt)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── ENUMS ───────────────────────────────────────────────────────────────────

create type zone as enum ('pantry', 'fridge', 'freezer', 'leftovers');
create type qty_unit as enum ('g', 'kg', 'ml', 'L', 'piece', 'slice');
create type meal_source as enum ('user', 'seed');

-- ─── INVENTORY ITEMS ─────────────────────────────────────────────────────────

create table inventory_items (
  id                         uuid primary key default uuid_generate_v4(),
  user_id                    uuid not null references auth.users(id) on delete cascade,
  name                       text not null,
  ingredient_name_normalized text not null,
  zone                       zone not null default 'fridge',
  qty                        numeric,
  qty_unit                   qty_unit,
  expiry_date                date,
  barcode                    text,
  updated_at                 timestamptz not null default now(),
  created_at                 timestamptz not null default now()
);

create index inventory_items_user_id_idx on inventory_items(user_id);
create index inventory_items_expiry_idx  on inventory_items(user_id, expiry_date) where expiry_date is not null;

alter table inventory_items enable row level security;
create policy "user_owns_row" on inventory_items
  for all using (user_id = auth.uid());

-- ─── MEALS ───────────────────────────────────────────────────────────────────

create table meals (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  cooked_at  timestamptz not null default now(),
  source     meal_source not null default 'user',
  notes      text,
  updated_at timestamptz not null default now()
);

create index meals_user_id_idx      on meals(user_id);
create index meals_cooked_at_idx    on meals(user_id, cooked_at desc);

alter table meals enable row level security;
create policy "user_owns_row" on meals
  for all using (user_id = auth.uid());

-- ─── MEAL INGREDIENTS ────────────────────────────────────────────────────────

create table meal_ingredients (
  id                         uuid primary key default uuid_generate_v4(),
  meal_id                    uuid not null references meals(id) on delete cascade,
  ingredient_name            text not null,
  ingredient_name_normalized text not null,
  qty                        numeric,
  qty_unit                   qty_unit
);

create index meal_ingredients_meal_id_idx on meal_ingredients(meal_id);

-- No RLS needed — access controlled via meals table (meal_id FK)
-- But we expose via a view that joins user_id for safety
alter table meal_ingredients enable row level security;
create policy "user_owns_parent_meal" on meal_ingredients
  for all using (
    exists (
      select 1 from meals
      where meals.id = meal_ingredients.meal_id
        and meals.user_id = auth.uid()
    )
  );

-- ─── SHOPPING LIST ───────────────────────────────────────────────────────────

create table shopping_list (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  ingredient_name  text not null,
  qty              numeric,
  qty_unit         qty_unit,
  is_checked       boolean not null default false,
  from_meal_id     uuid references meals(id) on delete set null,
  created_at       timestamptz not null default now()
);

create index shopping_list_user_id_idx on shopping_list(user_id);

alter table shopping_list enable row level security;
create policy "user_owns_row" on shopping_list
  for all using (user_id = auth.uid());

-- ─── MEAL PLANS ──────────────────────────────────────────────────────────────

create table meal_plans (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  meal_id      uuid not null references meals(id) on delete cascade,
  planned_date date not null,
  unique(user_id, planned_date)
);

create index meal_plans_user_id_idx on meal_plans(user_id, planned_date);

alter table meal_plans enable row level security;
create policy "user_owns_row" on meal_plans
  for all using (
    user_id = auth.uid()
    and exists (
      select 1 from meals
      where meals.id = meal_plans.meal_id
        and meals.user_id = auth.uid()
    )
  );

-- ─── UPDATED_AT TRIGGER ──────────────────────────────────────────────────────

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger inventory_items_updated_at
  before update on inventory_items
  for each row execute function update_updated_at();

create trigger meals_updated_at
  before update on meals
  for each row execute function update_updated_at();
