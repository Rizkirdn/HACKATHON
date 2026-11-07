-- Seed demo into linked Supabase project.
-- Does not touch auth.users or passwords. Safe for existing schema.

begin;

insert into public.branches (id, code, name, address, multiplier) values
  ('c1', 'C01', 'Cimol Pusat', 'Jl. Braga No. 12, Bandung', 1),
  ('c2', 'C02', 'Cabang Dago', 'Jl. Ir. H. Juanda No. 88', 0.82),
  ('c3', 'C03', 'Cabang Buah Batu', 'Jl. Buah Batu No. 140', 0.64)
on conflict (id) do update set code=excluded.code, name=excluded.name, address=excluded.address, multiplier=excluded.multiplier;

insert into public.products (id, name, type, portions, price, tone) values
  ('cimol', 'Cimol', 'porsi', '{5000,8000,10000}', null, 'bg-amber-100 text-amber-800'),
  ('cibay', 'Cibay', 'pcs', null, 1000, 'bg-orange-100 text-orange-800'),
  ('cireng', 'Cireng', 'pcs', null, 1000, 'bg-rose-100 text-rose-800')
on conflict (id) do update set name=excluded.name, type=excluded.type, portions=excluded.portions, price=excluded.price, tone=excluded.tone;

insert into public.spices (name) values
  ('Asin'), ('Keju'), ('Balado'), ('BBQ'), ('Pedas L1'), ('Pedas L2'), ('Pedas L3'),
  ('Rumput Laut'), ('Sapi Panggang'), ('Bawang Goreng'), ('Chilli Oil'), ('Minyak Bawang'),
  ('Daun Jeruk'), ('Jagung Manis'), ('Jagung Bakar')
on conflict (name) do nothing;

insert into public.stock_items (id, branch_id, name, unit, unit_price, minimum, category, quantity, updated_at)
select 'c' || b.id || '-' || s.code, b.id, s.name, s.unit, s.unit_price, s.minimum, s.category, s.quantity, now()
from public.branches b
cross join (values
  ('s1','Tepung Aci','kg',12000,10,'Cimol',24), ('s2','Adonan Cibay','kg',18000,6,'Cibay',5),
  ('s3','Adonan Cireng','kg',16000,6,'Cireng',0), ('s4','Bumbu Keju','pak',22000,4,'Bumbu',9),
  ('s5','Bumbu Balado','pak',20000,4,'Bumbu',3), ('s6','Minyak Goreng','liter',17000,12,'Lainnya',30),
  ('s7','Kemasan Cup','pack',15000,8,'Lainnya',14), ('s8','Bumbu BBQ','pak',21000,4,'Bumbu',6)
) as s(code,name,unit,unit_price,minimum,category,quantity)
on conflict (id) do update set branch_id=excluded.branch_id, name=excluded.name, unit=excluded.unit,
unit_price=excluded.unit_price, minimum=excluded.minimum, category=excluded.category,
quantity=excluded.quantity, updated_at=excluded.updated_at;

-- Profiles are linked only when matching Auth accounts already exist.
insert into public.profiles (id, name, username, role, active)
select u.id, v.name, v.username, v.role::public.app_role, v.active
from auth.users u
join (values
  ('rina@kasircimol.local','Rina Wijaya','rina','owner',true),
  ('dedi@c01.kasircimol.local','Dedi Kurnia','dedi@c01','admin',true),
  ('wulan@c03.kasircimol.local','Wulan Anggraini','wulan@c03','admin',true),
  ('budi@c01.kasircimol.local','Budi Santoso','budi@c01','kasir',true),
  ('sari@c01.kasircimol.local','Sari Lestari','sari@c01','kasir',true),
  ('tono@c01.kasircimol.local','Tono Prasetyo','tono@c01','kasir',false),
  ('ayu@c02.kasircimol.local','Ayu Rahmawati','ayu@c02','kasir',true),
  ('rizky@c03.kasircimol.local','Rizky Pratama','rizky@c03','kasir',true)
) as v(email,name,username,role,active) on lower(u.email)=lower(v.email)
on conflict (id) do update set name=excluded.name, username=excluded.username, role=excluded.role, active=excluded.active;

insert into public.profile_branches (profile_id, branch_id)
select p.id, x.branch_id from public.profiles p
join (values
  ('dedi@c01','c1'),('dedi@c01','c2'),('wulan@c03','c3'),('budi@c01','c1'),
  ('sari@c01','c1'),('tono@c01','c1'),('ayu@c02','c2'),('rizky@c03','c3')
) as x(username,branch_id) on x.username=p.username
on conflict do nothing;

-- Replace only fixed demo operational rows, not arbitrary user data.
delete from public.transactions where id in ('t1','t2','t3');
delete from public.purchases where id in ('b1','b2','b3','b4');

insert into public.transactions (id,branch_id,number,occurred_at,total,paid,cashier_id,shift,status,method,items,void_reason)
select v.id,'c1',v.number,v.occurred_at,v.total,v.paid,p.id,1,v.status,v.method::public.payment_method,v.items::jsonb,v.void_reason
from (values
('t1','C01-S1-0003',now()-interval '19 minutes',18000,20000,'budi@c01','sah','tunai', '[{"nama":"Cimol 10k","sub":"Keju, Balado","qty":1,"harga":10000},{"nama":"Cimol 8k","sub":"Original","qty":1,"harga":8000}]',null),
('t2','C01-S1-0002',now()-interval '38 minutes',7000,10000,'budi@c01','sah','tunai', '[{"nama":"Cibay","sub":"BBQ","qty":4,"harga":1000},{"nama":"Cireng","sub":"Asin","qty":3,"harga":1000}]',null),
('t3','C01-S1-0001',now()-interval '55 minutes',5000,5000,'budi@c01','void','tunai','[{"nama":"Cimol 5k","sub":"Pedas L2","qty":1,"harga":5000}]','Salah input porsi')
) as v(id,number,occurred_at,total,paid,username,status,method,items,void_reason)
left join public.profiles p on p.username=v.username;

insert into public.purchases (id,branch_id,stock_id,name,unit,quantity,price,note,status,requested_by,created_at)
select v.id,'c1','cc1-'||v.stock_code,v.name,v.unit,v.quantity,v.price,v.note,v.status::public.purchase_status,p.id,now()-v.age
from (values
('b1','s3','Adonan Cireng','kg',10,null::integer,'Habis sejak siang','pending','budi@c01',interval '20 minutes'),
('b2','s5','Bumbu Balado','pak',6,null::integer,'','pending','budi@c01',interval '10 minutes'),
('b3','s6','Minyak Goreng','liter',20,330000,'','selesai','sari@c01',interval '1 day'),
('b4','s7','Kemasan Cup','pack',5,null::integer,'Merek lama','ditolak','sari@c01',interval '1 day')
) as v(id,stock_code,name,unit,quantity,price,note,status,username,age)
left join public.profiles p on p.username=v.username;

commit;
