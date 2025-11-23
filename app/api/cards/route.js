import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("DEBUG EMAIL:", process.env.GOOGLE_CLIENT_EMAIL);
    console.log("DEBUG SHEET:", process.env.GOOGLE_SHEET_ID);

    const rawKey = process.env.GOOGLE_PRIVATE_KEY;
    if (!rawKey) throw new Error("Private key missing");

    const privateKey = rawKey.replace(/\\n/g, "\n");

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const tokenResponse = await auth.getAccessToken();
    const accessToken = tokenResponse?.token;

    if (!accessToken || accessToken.length < 30) {
      console.log("BAD TOKEN:", accessToken);
      throw new Error("Token invalid");
    }

    const sheetId = process.env.GOOGLE_SHEET_ID;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Data!A:Z?majorDimension=ROWS`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const raw = await response.text();
      console.log("🔥 GOOGLE RAW ERROR:", raw);
      throw new Error("Sheets API error");
    }

    const json = await response.json();
    const rows = json.values || [];

    if (rows.length < 2) {
      return NextResponse.json({ cards: [] });
    }

    const header = rows[0];
    const body = rows.slice(1);

    const formatted = body.map((row) => {
      const obj = {};
      header.forEach((col, i) => (obj[col] = row[i] ?? ""));
      return obj;
    });

    console.log("DEBUG: Final formatted row count:", formatted.length);

    return NextResponse.json({ cards: formatted });
  } catch (error) {
    console.error("🔥 ROUTE ERROR:", error);
    return NextResponse.json(
      { error: "Failed to load data" },
      { status: 500 }
    );
  }
}
