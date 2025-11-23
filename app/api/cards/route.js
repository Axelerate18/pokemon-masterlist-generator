import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // -------------------------------
    // DEBUG: Show loaded env values
    // -------------------------------
    console.log("DEBUG EMAIL:", process.env.GOOGLE_CLIENT_EMAIL);
    console.log("DEBUG SHEET:", process.env.GOOGLE_SHEET_ID);

    if (!process.env.GOOGLE_PRIVATE_KEY) {
      console.log("DEBUG KEY: MISSING");
    } else {
      console.log("DEBUG KEY LENGTH:", process.env.GOOGLE_PRIVATE_KEY.length);
      console.log("DEBUG KEY FIRST 40:", process.env.GOOGLE_PRIVATE_KEY.slice(0, 40));
      console.log("DEBUG KEY LAST 40:", process.env.GOOGLE_PRIVATE_KEY.slice(-40));
    }

    // -------------------------------
    // NORMALIZE PRIVATE KEY
    // -------------------------------

    const rawKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!rawKey) {
      throw new Error("Private key missing");
    }

    // Fix all newline variations
    const privateKey = rawKey
      .replace(/\\n/g, "\n")      // convert \n -> actual newline
      .replace(/\r?\n/g, "\n");   // normalize endings

    console.log("DEBUG: Normalized private key length:", privateKey.length);

    // -------------------------------
    // CREATE JWT CLIENT
    // -------------------------------

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    console.log("DEBUG: Auth object created OK");

    // -------------------------------
    // OBTAIN ACCESS TOKEN
    // -------------------------------

    // GoogleAuth v9 returns { token, res }
    const tokenResponse = await auth.getAccessToken();
    const accessToken = tokenResponse?.token;

    console.log("DEBUG RAW TOKEN RESPONSE:", tokenResponse);
    console.log("DEBUG EXTRACTED TOKEN:", accessToken);

    if (!accessToken || accessToken.length < 30) {
      console.log("DEBUG BAD TOKEN:", accessToken);
      throw new Error("Access token missing or invalid");
    }

console.log("DEBUG ACCESS TOKEN OK, length:", accessToken.length);

    // -------------------------------
    // DIRECT REST CALL TO SHEETS API
    // -------------------------------

    const sheetId = process.env.GOOGLE_SHEET_ID;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Data!A:Z?majorDimension=ROWS`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.log("🔥 GOOGLE RAW ERROR:", text);
      throw new Error(`Sheets API failed: HTTP ${response.status}`);
    }

    const json = await response.json();
    console.log("DEBUG: Sheets returned data OK");

    // -------------------------------
    // RETURN RESULT
    // -------------------------------

    return NextResponse.json({ values: json.values || [] });

  } catch (error) {
    console.error("🔥 ROUTE ERROR:", error);
    return NextResponse.json(
      { error: "Failed to load data" },
      { status: 500 }
    );
  }
}
