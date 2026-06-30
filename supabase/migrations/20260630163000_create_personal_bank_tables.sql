create table if not exists public.personal_bank_targets (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric not null check (amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.personal_bank_daily_logs (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  log_date date not null,
  amount numeric not null check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (user_id, log_date)
);

create table if not exists public.personal_bank_rewards (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null check (length(trim(label)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.personal_bank_spin_claims (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  target_id uuid,
  reward_id uuid,
  reward_label_snapshot text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists personal_bank_targets_user_id_idx
  on public.personal_bank_targets (user_id);

create index if not exists personal_bank_daily_logs_user_id_idx
  on public.personal_bank_daily_logs (user_id);

create index if not exists personal_bank_rewards_user_id_idx
  on public.personal_bank_rewards (user_id);

create index if not exists personal_bank_spin_claims_user_id_idx
  on public.personal_bank_spin_claims (user_id);

create unique index if not exists personal_bank_spin_claims_user_target_idx
  on public.personal_bank_spin_claims (user_id, target_id)
  where target_id is not null and deleted_at is null;

alter table public.personal_bank_targets enable row level security;
alter table public.personal_bank_daily_logs enable row level security;
alter table public.personal_bank_rewards enable row level security;
alter table public.personal_bank_spin_claims enable row level security;

drop policy if exists "personal bank targets select own" on public.personal_bank_targets;
create policy "personal bank targets select own"
  on public.personal_bank_targets
  for select
  using (auth.uid() = user_id);

drop policy if exists "personal bank targets insert own" on public.personal_bank_targets;
create policy "personal bank targets insert own"
  on public.personal_bank_targets
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "personal bank targets update own" on public.personal_bank_targets;
create policy "personal bank targets update own"
  on public.personal_bank_targets
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "personal bank targets delete own" on public.personal_bank_targets;
create policy "personal bank targets delete own"
  on public.personal_bank_targets
  for delete
  using (auth.uid() = user_id);

drop policy if exists "personal bank daily logs select own" on public.personal_bank_daily_logs;
create policy "personal bank daily logs select own"
  on public.personal_bank_daily_logs
  for select
  using (auth.uid() = user_id);

drop policy if exists "personal bank daily logs insert own" on public.personal_bank_daily_logs;
create policy "personal bank daily logs insert own"
  on public.personal_bank_daily_logs
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "personal bank daily logs update own" on public.personal_bank_daily_logs;
create policy "personal bank daily logs update own"
  on public.personal_bank_daily_logs
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "personal bank daily logs delete own" on public.personal_bank_daily_logs;
create policy "personal bank daily logs delete own"
  on public.personal_bank_daily_logs
  for delete
  using (auth.uid() = user_id);

drop policy if exists "personal bank rewards select own" on public.personal_bank_rewards;
create policy "personal bank rewards select own"
  on public.personal_bank_rewards
  for select
  using (auth.uid() = user_id);

drop policy if exists "personal bank rewards insert own" on public.personal_bank_rewards;
create policy "personal bank rewards insert own"
  on public.personal_bank_rewards
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "personal bank rewards update own" on public.personal_bank_rewards;
create policy "personal bank rewards update own"
  on public.personal_bank_rewards
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "personal bank rewards delete own" on public.personal_bank_rewards;
create policy "personal bank rewards delete own"
  on public.personal_bank_rewards
  for delete
  using (auth.uid() = user_id);

drop policy if exists "personal bank spin claims select own" on public.personal_bank_spin_claims;
create policy "personal bank spin claims select own"
  on public.personal_bank_spin_claims
  for select
  using (auth.uid() = user_id);

drop policy if exists "personal bank spin claims insert own" on public.personal_bank_spin_claims;
create policy "personal bank spin claims insert own"
  on public.personal_bank_spin_claims
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "personal bank spin claims update own" on public.personal_bank_spin_claims;
create policy "personal bank spin claims update own"
  on public.personal_bank_spin_claims
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "personal bank spin claims delete own" on public.personal_bank_spin_claims;
create policy "personal bank spin claims delete own"
  on public.personal_bank_spin_claims
  for delete
  using (auth.uid() = user_id);
