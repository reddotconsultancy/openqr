// Storage for dynamic QR links.
// On Vercel this uses Upstash Redis (free tier). Without Redis settings it
// falls back to memory, which is only for trying the app on your own computer.
import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

export const usingRedis = Boolean(url && token);

function memoryStore() {
  const g = globalThis;
  if (!g.__openqrMem) g.__openqrMem = { data: new Map(), expiry: new Map() };
  const { data, expiry } = g.__openqrMem;
  const alive = (k) => {
    const e = expiry.get(k);
    if (e && e < Date.now()) {
      data.delete(k);
      expiry.delete(k);
    }
    return data.has(k);
  };
  return {
    async get(k) {
      return alive(k) ? data.get(k) : null;
    },
    async set(k, v, opts) {
      if (opts?.nx && alive(k)) return null;
      data.set(k, v);
      if (opts?.ex) expiry.set(k, Date.now() + opts.ex * 1000);
      return "OK";
    },
    async del(k) {
      data.delete(k);
      expiry.delete(k);
      return 1;
    },
    async incr(k) {
      const n = (alive(k) ? Number(data.get(k)) : 0) + 1;
      data.set(k, n);
      return n;
    },
    async expire(k, s) {
      expiry.set(k, Date.now() + s * 1000);
      return 1;
    },
    async lpush(k, v) {
      const list = alive(k) ? data.get(k) : [];
      list.unshift(v);
      data.set(k, list);
      return list.length;
    },
    async ltrim(k, start, stop) {
      const list = alive(k) ? data.get(k) : [];
      data.set(k, list.slice(start, stop + 1));
      return "OK";
    },
    async lrange(k, start, stop) {
      const list = alive(k) ? data.get(k) : [];
      return list.slice(start, stop === -1 ? undefined : stop + 1);
    },
  };
}

const db = usingRedis ? new Redis({ url, token }) : memoryStore();

const linkKey = (id) => `link:${id}`;
const scanKey = (id) => `scans:${id}`;

// Upstash returns parsed JSON for objects; memory returns what we stored.
const parse = (v) => (typeof v === "string" ? JSON.parse(v) : v);

export async function createLink(id, record) {
  // nx: only create if this id is not taken yet
  const ok = await db.set(linkKey(id), JSON.stringify(record), { nx: true });
  return ok === "OK";
}

export async function getLink(id) {
  const v = await db.get(linkKey(id));
  return v ? parse(v) : null;
}

export async function saveLink(id, record) {
  await db.set(linkKey(id), JSON.stringify(record));
}

export async function deleteLink(id) {
  await db.del(linkKey(id));
  await db.del(scanKey(id));
}

export async function countScan(id) {
  return db.incr(scanKey(id));
}

export async function getScans(id) {
  return Number((await db.get(scanKey(id))) || 0);
}

// Fixed-window rate limit. Returns true when the request is allowed.
export async function allow(key, limit, windowSeconds) {
  const k = `rl:${key}:${Math.floor(Date.now() / 1000 / windowSeconds)}`;
  const n = await db.incr(k);
  if (n === 1) await db.expire(k, windowSeconds);
  return n <= limit;
}

export async function addReport(report) {
  await db.lpush("reports", JSON.stringify(report));
  await db.ltrim("reports", 0, 999);
}

export async function listReports() {
  const items = await db.lrange("reports", 0, 199);
  return items.map(parse);
}
