-- =============================================================================
-- O mínimo do Supabase que as migrações esperam, para rodar num Postgres
-- DESCARTÁVEL (o PGlite dos testes, ou um Postgres local). NÃO vai para o
-- Supabase de verdade: lá isto já existe.
--
-- O que imita, igual ao Supabase:
-- - os papéis `anon`, `authenticated` e `service_role` (este ignora a RLS);
-- - `auth.users`, `auth.uid()` e `auth.role()`, lidos de `request.jwt.claims`
--   (o PostgREST põe o JWT do pedido nessa variável);
-- - os privilégios padrão: tudo que o `postgres` cria em `public` nasce com
--   ALL para os três papéis, e a RLS decide a linha.
-- =============================================================================

create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;

create schema auth;
create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create function auth.uid() returns uuid language sql stable as $fn$
  select nullif(coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
  ), '')::uuid
$fn$;

create function auth.role() returns text language sql stable as $fn$
  select coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'
  )
$fn$;

grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid(), auth.role() to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;

alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
