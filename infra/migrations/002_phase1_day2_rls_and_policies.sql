-- Faza 1 / Dzien 2: RLS + policies
-- Zakres: tabele user-centric (owner-only) oraz read-only katalog dla anon/authenticated.

alter table public.profiles enable row level security;
alter table public.user_category_unlocks enable row level security;
alter table public.user_word_progress enable row level security;
alter table public.quiz_sessions enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.user_wallet enable row level security;
alter table public.points_ledger enable row level security;
alter table public.categories enable row level security;
alter table public.words enable row level security;

-- profiles
create policy profiles_select_own
  on public.profiles
  for select
  using (auth.uid() = user_id);

create policy profiles_insert_own
  on public.profiles
  for insert
  with check (auth.uid() = user_id);

create policy profiles_update_own
  on public.profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- user_category_unlocks
create policy user_category_unlocks_select_own
  on public.user_category_unlocks
  for select
  using (auth.uid() = user_id);

create policy user_category_unlocks_insert_own
  on public.user_category_unlocks
  for insert
  with check (auth.uid() = user_id);

create policy user_category_unlocks_update_own
  on public.user_category_unlocks
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- user_word_progress
create policy user_word_progress_select_own
  on public.user_word_progress
  for select
  using (auth.uid() = user_id);

create policy user_word_progress_insert_own
  on public.user_word_progress
  for insert
  with check (auth.uid() = user_id);

create policy user_word_progress_update_own
  on public.user_word_progress
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- quiz_sessions
create policy quiz_sessions_select_own
  on public.quiz_sessions
  for select
  using (auth.uid() = user_id);

create policy quiz_sessions_insert_own
  on public.quiz_sessions
  for insert
  with check (auth.uid() = user_id);

create policy quiz_sessions_update_own
  on public.quiz_sessions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- quiz_answers (owner przez relacje do quiz_sessions)
create policy quiz_answers_select_own
  on public.quiz_answers
  for select
  using (
    exists (
      select 1
      from public.quiz_sessions qs
      where qs.id = quiz_answers.session_id
        and qs.user_id = auth.uid()
    )
  );

create policy quiz_answers_insert_own
  on public.quiz_answers
  for insert
  with check (
    exists (
      select 1
      from public.quiz_sessions qs
      where qs.id = quiz_answers.session_id
        and qs.user_id = auth.uid()
    )
  );

create policy quiz_answers_update_own
  on public.quiz_answers
  for update
  using (
    exists (
      select 1
      from public.quiz_sessions qs
      where qs.id = quiz_answers.session_id
        and qs.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.quiz_sessions qs
      where qs.id = quiz_answers.session_id
        and qs.user_id = auth.uid()
    )
  );

-- user_wallet
create policy user_wallet_select_own
  on public.user_wallet
  for select
  using (auth.uid() = user_id);

create policy user_wallet_insert_own
  on public.user_wallet
  for insert
  with check (auth.uid() = user_id);

create policy user_wallet_update_own
  on public.user_wallet
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- points_ledger
create policy points_ledger_select_own
  on public.points_ledger
  for select
  using (auth.uid() = user_id);

create policy points_ledger_insert_own
  on public.points_ledger
  for insert
  with check (auth.uid() = user_id);

create policy points_ledger_update_own
  on public.points_ledger
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Katalog: publiczny odczyt (anon + authenticated), bez write policies.
create policy categories_select_public
  on public.categories
  for select
  using (true);

create policy words_select_public
  on public.words
  for select
  using (true);
