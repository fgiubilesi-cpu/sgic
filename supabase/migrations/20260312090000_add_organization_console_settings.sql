alter table public.organizations
add column if not exists logo_url text,
add column if not exists settings jsonb not null default '{}'::jsonb;

comment on column public.organizations.settings is 'Tenant-level admin console configuration for profile, rules, branding and notifications.';
