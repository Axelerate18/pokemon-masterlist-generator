import { NextResponse } from "next/server";
import crypto from "crypto";

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function sign(data, secret) {
  return crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function getClientIp(req) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export async function GET(req) {
  const secret = process.env.API_TOKEN_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Missing API_TOKEN_SECRET" }, { status: 500 });
  }

  // 5 minute expiry
  const exp = Math.floor(Date.now() / 1000) + 5 * 60;

  // Bind token to IP (helps deter sharing/reuse)
  const ip = getClientIp(req);

  const payloadObj = { exp, ip };
  const payload = base64url(JSON.stringify(payloadObj));
  const signature = sign(payload, secret);

  // Token is "payload.signature"
  const token = `${payload}.${signature}`;

  return NextResponse.json(
    { token, exp },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
