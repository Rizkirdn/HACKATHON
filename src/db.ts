import Dexie, { type Table } from "dexie";
import type { Belanja, Produk, Stok, Trx, User } from "./store";

export type LocalEntity = Produk | Stok | Belanja | Trx | User;
export interface SyncJob {
  id?: number;
  table: string;
  operation: "upsert" | "delete";
  payload: unknown;
  createdAt: number;
}

class KasirDatabase extends Dexie {
  produk!: Table<Produk, string>;
  stok!: Table<Stok, string>;
  belanja!: Table<Belanja, string>;
  trx!: Table<Trx, string>;
  users!: Table<User, string>;
  syncJobs!: Table<SyncJob, number>;

  constructor() {
    super("kasir-cimol");
    this.version(1).stores({
      produk: "id",
      stok: "id",
      belanja: "id",
      trx: "id",
      users: "id",
      syncJobs: "++id, table, createdAt",
    });
    this.version(2)
      .stores({
        produk: "id",
        stok: "id",
        belanja: "id",
        trx: "id",
        users: "id",
        syncJobs: "++id, table, createdAt",
      })
      .upgrade(async (tx) => {
        await Promise.all([
          tx.table("produk").clear(),
          tx.table("stok").clear(),
          tx.table("belanja").clear(),
          tx.table("trx").clear(),
          tx.table("users").clear(),
          tx.table("syncJobs").clear(),
        ]);
      });
  }
}

export const db = new KasirDatabase();

export async function saveLocal<T extends { id: string }>(
  table: Table<T, string>,
  value: T,
  online: boolean,
  queue: Omit<SyncJob, "id" | "createdAt">,
) {
  await table.put(value);
  if (!online) await db.syncJobs.add({ ...queue, createdAt: Date.now() });
}

export async function deleteLocal<T>(
  table: Table<T, string>,
  id: string,
  online: boolean,
  queue: Omit<SyncJob, "id" | "createdAt">,
) {
  await table.delete(id);
  if (!online) await db.syncJobs.add({ ...queue, createdAt: Date.now() });
}

export async function pendingSyncJobs() {
  return db.syncJobs.orderBy("createdAt").toArray();
}

export async function removeSyncJob(id: number) {
  await db.syncJobs.delete(id);
}
