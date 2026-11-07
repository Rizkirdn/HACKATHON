-- Jalankan sekali jika ingin menghapus seluruh data operasional lama.
-- PERINGATAN: menghapus semua produk, bumbu, stok, pembelian, transaksi,
-- profile branch, dan profile aplikasi. Data Auth tidak dihapus di sini.

begin;

delete from public.transactions;
delete from public.purchases;
delete from public.stock_items;
delete from public."spices";
delete from public.products;
delete from public.profile_branches;
delete from public.profiles;

commit;
