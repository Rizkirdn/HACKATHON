-- Link demo rows to existing profiles in active project.
-- Uses existing accounts only; creates no Auth users and changes no passwords.
begin;

update public.transactions t
set cashier_id = p.id
from public.profiles p
where t.id in ('t1', 't2', 't3')
  and p.username = 'sani';

update public.purchases b
set requested_by = p.id
from public.profiles p
where b.id in ('b1', 'b2', 'b3', 'b4')
  and p.username = 'sani';

commit;
