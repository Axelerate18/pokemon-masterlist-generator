import { google } from "googleapis";
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

// Upstash Redis client (shared across serverless instances)
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// Best-effort in-memory cache (per instance)
let memCache = { at: 0, data: null };
const MEM_CACHE_TTL_MS = 60_000; // 60 seconds

function getClientIp(req) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

async function rateLimit(req, { limit = 5, windowSeconds = 60 } = {}) {
  // If Redis isn't configured, don't block (but do configure it)
  if (!redis) return { ok: true };

  const ip = getClientIp(req);
  const key = `rl:cards:${ip}`;

  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, windowSeconds);

  return { ok: count <= limit };
}

export async function GET(req) {
  try {
    // 1) Rate limit first
    const rl = await rateLimit(req, { limit: 5, windowSeconds: 60 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: { "Cache-Control": "no-store" } }
      );
    }

    // 2) Serve from best-effort memory cache
    if (memCache.data && Date.now() - memCache.at < MEM_CACHE_TTL_MS) {
      return NextResponse.json(memCache.data, {
        headers: {
          // Vercel CDN cache
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
        },
      });
    }

    // 3) Validate env vars
    const email = process.env.GOOGLE_CLIENT_EMAIL;
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const rawKey = process.env.GOOGLE_PRIVATE_KEY;
    if (!email || !sheetId || !rawKey) {
      throw new Error("Missing Google env vars");
    }

    const privateKey = rawKey.replace(/\\n/g, "\n");

    // 4) Auth (READONLY scope)
    const auth = new google.auth.JWT({
      email,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const tokenResponse = await auth.getAccessToken();
    const accessToken = tokenResponse?.token;

    if (!accessToken || accessToken.length < 30) {
      throw new Error("Token invalid");
    }

    // 5) Fetch sheet values (same proven method you already use)
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Data!A:Z?majorDimension=ROWS`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const raw = await response.text();
      throw new Error(`Sheets API error: ${response.status} ${raw}`);
    }

    const json = await response.json();
    const rows = json.values || [];

    if (rows.length < 2) {
      const payload = { cards: [] };
      memCache = { at: Date.now(), data: payload };
      return NextResponse.json(payload, {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600",
        },
      });
    }

    const header = rows[0];
    const body = rows.slice(1);

    const formatted = body.map((row) => {
      const obj = {};
      header.forEach((col, i) => (obj[col] = row[i] ?? ""));
      return obj;
    });

    const payload = { cards: formatted };

    // Update memory cache
    memCache = { at: Date.now(), data: payload };

    // 6) Return with CDN caching
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    console.error("API /api/cards error:", error?.message || error);
    return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
  }
}
