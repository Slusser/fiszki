-- Faza 1 / Dzien 3: poprawki po Supabase advisors (performance).
-- 1) Indeksy pokrywajace brakujace FK.
-- 2) Optymalizacja polityk RLS: auth.uid() -> (select auth.uid()).

create index if not exists idx_quiz_answers_word_id
  on public.quiz_answers (word_id);

create index if not exists idx_quiz_sessions_category_id
  on public.quiz_sessions (category_id);

create index if not exists idx_user_category_unlocks_category_id
  on public.user_category_unlocks (category_id);

create index if not exists idx_user_word_progress_word_id
  on public.user_word_progress (word_id);

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_select_own
  on public.profiles
  for select
  using ((select auth.uid()) = user_id);
create policy profiles_insert_own
  on public.profiles
  for insert
  with check ((select auth.uid()) = user_id);
create policy profiles_update_own
  on public.profiles
  for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists user_category_unlocks_select_own on public.user_category_unlocks;
drop policy if exists user_category_unlocks_insert_own on public.user_category_unlocks;
drop policy if exists user_category_unlocks_update_own on public.user_category_unlocks;
create policy user_category_unlocks_select_own
  on public.user_category_unlocks
  for select
  using ((select auth.uid()) = user_id);
create policy user_category_unlocks_insert_own
  on public.user_category_unlocks
  for insert
  with check ((select auth.uid()) = user_id);
create policy user_category_unlocks_update_own
  on public.user_category_unlocks
  for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists user_word_progress_select_own on public.user_word_progress;
drop policy if exists user_word_progress_insert_own on public.user_word_progress;
drop policy if exists user_word_progress_update_own on public.user_word_progress;
create policy user_word_progress_select_own
  on public.user_word_progress
  for select
  using ((select auth.uid()) = user_id);
create policy user_word_progress_insert_own
  on public.user_word_progress
  for insert
  with check ((select auth.uid()) = user_id);
create policy user_word_progress_update_own
  on public.user_word_progress
  for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists quiz_sessions_select_own on public.quiz_sessions;
drop policy if exists quiz_sessions_insert_own on public.quiz_sessions;
drop policy if exists quiz_sessions_update_own on public.quiz_sessions;
create policy quiz_sessions_select_own
  on public.quiz_sessions
  for select
  using ((select auth.uid()) = user_id);
create policy quiz_sessions_insert_own
  on public.quiz_sessions
  for insert
  with check ((select auth.uid()) = user_id);
create policy quiz_sessions_update_own
  on public.quiz_sessions
  for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists quiz_answers_select_own on public.quiz_answers;
drop policy if exists quiz_answers_insert_own on public.quiz_answers;
drop policy if exists quiz_answers_update_own on public.quiz_answers;
create policy quiz_answers_select_own
  on public.quiz_answers
  for select
  using (
    exists (
      select 1
      from public.quiz_sessions qs
      where qs.id = quiz_answers.session_id
        and qs.user_id = (select auth.uid())
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
        and qs.user_id = (select auth.uid())
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
        and qs.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.quiz_sessions qs
      where qs.id = quiz_answers.session_id
        and qs.user_id = (select auth.uid())
    )
  );

drop policy if exists user_wallet_select_own on public.user_wallet;
drop policy if exists user_wallet_insert_own on public.user_wallet;
drop policy if exists user_wallet_update_own on public.user_wallet;
create policy user_wallet_select_own
  on public.user_wallet
  for select
  using ((select auth.uid()) = user_id);
create policy user_wallet_insert_own
  on public.user_wallet
  for insert
  with check ((select auth.uid()) = user_id);
create policy user_wallet_update_own
  on public.user_wallet
  for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists points_ledger_select_own on public.points_ledger;
drop policy if exists points_ledger_insert_own on public.points_ledger;
drop policy if exists points_ledger_update_own on public.points_ledger;
create policy points_ledger_select_own
  on public.points_ledger
  for select
  using ((select auth.uid()) = user_id);
create policy points_ledger_insert_own
  on public.points_ledger
  for insert
  with check ((select auth.uid()) = user_id);
create policy points_ledger_update_own
  on public.points_ledger
  for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
