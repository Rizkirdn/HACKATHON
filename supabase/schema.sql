create extension if not exists pgcrypto;

do $$ begin create type public.app_role as enum ('owner', 'admin', 'kasir'); exception when duplicate_object then null; end $$;
do $$ begin create type public.payment_method as enum ('tunai', 'qris'); exception when duplicate_object then null; end $$;
do $$ begin create type public.purchase_status as enum ('pending', 'selesai', 'ditolak'); exception when duplicate_object then null; end $$;

create table if not exists public.branches (
  id text primary key, code text not null unique, name text not null, address text not null, multiplier numeric not null default 1
);
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade, name text not null, username text unique not null, role public.app_role not null, active boolean not null default true
);
create table if not exists public.profile_branches (
  profile_id uuid references public.profiles(id) on delete cascade, branch_id text references public.branches(id) on delete cascade, primary key(profile_id, branch_id)
);

insert into public.branches (id, code, name, address, multiplier)
values
  ('c1', 'C01', 'Cimol Pusat', 'Jl. Braga No. 12, Bandung', 1),
  ('c2', 'C02', 'Cabang Dago', 'Jl. Ir. H. Juanda No. 88', 0.82),
  ('c3', 'C03', 'Cabang Buah Batu', 'Jl. Buah Batu No. 140', 0.64)
on conflict (id) do nothing;

create table if not exists public.products (
  id text primary key, name text not null, type text not null check (type in ('porsi','pcs')), portions integer[], price integer, tone text not null
);
create table if not exists public."spices" (
  name text primary key
);
create table if not exists public.stock_items (
  id text primary key, branch_id text not null references public.branches(id), name text not null, unit text not null, unit_price integer not null default 0, minimum numeric not null default 0, category text not null, quantity numeric not null default 0, updated_at timestamptz not null default now()
);
create table if not exists public.purchases (
  id text primary key, branch_id text not null references public.branches(id), stock_id text not null references public.stock_items(id), name text not null, unit text not null, quantity numeric not null, price integer, note text not null default '', status public.purchase_status not null default 'pending', requested_by uuid references auth.users(id), created_at timestamptz not null default now()
);
create table if not exists public.transactions (
  id text primary key, branch_id text not null references public.branches(id), number text not null, occurred_at timestamptz not null default now(), total integer not null, paid integer not null, cashier_id uuid references auth.users(id), shift integer not null, status text not null default 'sah' check (status in ('sah','void')), method public.payment_method not null, items jsonb not null default '[]'::jsonb, void_reason text
);

alter table public.branches enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_branches enable row level security;
alter table public.products enable row level security;
alter table public."spices" enable row level security;
alter table public.stock_items enable row level security;
alter table public.purchases enable row level security;
alter table public.transactions enable row level security;

create or replace function public.is_active_user() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active = true and role in ('owner', 'admin', 'kasir'));
$$;
create or replace function public.is_staff() returns boolean language sql stable security definer set search_path = public as $$
  select public.is_active_user();
$$;
create or replace function public.is_manager() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active = true and role in ('owner', 'admin'));
$$;
create or replace function public.is_owner() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active = true and role = 'owner');
$$;
drop policy if exists "staff read branches" on public.branches;
drop policy if exists "users read accessible branches" on public.branches;
drop policy if exists "owner manage branches" on public.branches;
drop policy if exists "staff read products" on public.products;
drop policy if exists "staff read spices" on public."spices";
drop policy if exists "users read own profile" on public.profiles;
drop policy if exists "users read own branches" on public.profile_branches;
drop policy if exists "admins manage profiles" on public.profiles;
drop policy if exists "admins manage profile branches" on public.profile_branches;
drop policy if exists "owner manage profiles" on public.profiles;
drop policy if exists "owner manage profile branches" on public.profile_branches;
drop policy if exists "admins read profiles" on public.profiles;
drop policy if exists "admins read profile branches" on public.profile_branches;
drop policy if exists "staff manage products" on public.products;
drop policy if exists "manager manage products" on public.products;
drop policy if exists "staff manage spices" on public."spices";
drop policy if exists "manager manage spices" on public."spices";
drop policy if exists "staff read purchases" on public.purchases;
drop policy if exists "staff create purchases" on public.purchases;
drop policy if exists "manager manage purchases" on public.purchases;
drop policy if exists "staff read transactions" on public.transactions;
drop policy if exists "staff create transactions" on public.transactions;
drop policy if exists "manager manage transactions" on public.transactions;
create policy "staff read products" on public.products for select using (public.is_staff());
create policy "staff read spices" on public."spices" for select using (public.is_staff());
create policy "users read own profile" on public.profiles for select using (id = auth.uid());
create policy "users read own branches" on public.profile_branches for select using (profile_id = auth.uid());
create policy "owner manage profiles" on public.profiles for all using (public.is_owner()) with check (public.is_owner());
create policy "owner manage profile branches" on public.profile_branches for all using (public.is_owner()) with check (public.is_owner());
create policy "admins read profiles" on public.profiles for select using (public.is_manager());
create policy "admins read profile branches" on public.profile_branches for select using (public.is_manager());
create policy "manager manage products" on public.products for all using (public.is_manager()) with check (public.is_manager());
create policy "manager manage spices" on public."spices" for all using (public.is_manager()) with check (public.is_manager());

create index if not exists stock_items_branch_id_idx on public.stock_items(branch_id);
create index if not exists purchases_branch_id_created_at_idx on public.purchases(branch_id, created_at desc);
create index if not exists transactions_branch_id_occurred_at_idx on public.transactions(branch_id, occurred_at desc);

create or replace function public.user_branch_access(target_branch text) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.active and p.role = 'owner')
  or exists (select 1 from public.profile_branches pb join public.profiles p on p.id = pb.profile_id where pb.branch_id = target_branch and pb.profile_id = auth.uid() and p.active);
$$;

create policy "users read accessible branches" on public.branches for select using (public.user_branch_access(id));
create policy "owner manage branches" on public.branches for all using (public.is_owner()) with check (public.is_owner());

-- Replace broad staff policies with branch-scoped policies.
drop policy if exists "staff manage stock" on public.stock_items;
drop policy if exists "staff manage purchases" on public.purchases;
drop policy if exists "staff manage transactions" on public.transactions;
drop policy if exists "branch staff manage stock" on public.stock_items;
drop policy if exists "branch staff manage purchases" on public.purchases;
drop policy if exists "branch staff manage transactions" on public.transactions;
create policy "branch staff manage stock" on public.stock_items for all using (public.user_branch_access(branch_id)) with check (public.user_branch_access(branch_id));
create policy "branch staff manage purchases" on public.purchases for all using (public.user_branch_access(branch_id)) with check (public.user_branch_access(branch_id));
create policy "branch staff manage transactions" on public.transactions for all using (public.user_branch_access(branch_id)) with check (public.user_branch_access(branch_id));

alter table public.branches replica identity full;
alter table public.profiles replica identity full;
alter table public.profile_branches replica identity full;
alter table public.products replica identity full;
alter table public."spices" replica identity full;
alter table public.stock_items replica identity full;
alter table public.purchases replica identity full;
alter table public.transactions replica identity full;

-- Add realtime tables only when they are not already members.
do $$
declare
  table_name text;
begin
  foreach table_name in array array['branches', 'profiles', 'profile_branches', 'products', 'spices', 'stock_items', 'purchases', 'transactions'] loop
    if not exists (
      select 1
      from pg_publication p
      join pg_publication_rel pr on pr.prpubid = p.oid
      join pg_class c on c.oid = pr.prrelid
      join pg_namespace n on n.oid = c.relnamespace
      where p.pubname = 'supabase_realtime'
        and n.nspname = 'public'
        and c.relname = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end $$;

-- Isi branches, products, spices, stock_items, purchases, dan transactions dari aplikasi.
-- Buat user owner lewat Supabase Auth, lalu isi profiles dengan role = 'owner'.
