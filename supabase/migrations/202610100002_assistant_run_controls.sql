-- Scope stop requests to a run even before model admission. Rows expire with their thread.
create table app_private.assistant_run_controls (
 thread_id uuid not null references app_private.assistant_threads(id) on delete cascade,
 run_id uuid not null,
 accepted boolean not null default false,
 stop_requested boolean not null default false,
 finished boolean not null default false,
 primary key(thread_id,run_id),
 check(not finished or accepted),
 check(accepted or stop_requested)
);
alter table app_private.assistant_run_controls enable row level security;
revoke all on app_private.assistant_run_controls from public,anon,authenticated;
grant all on app_private.assistant_run_controls to service_role;
