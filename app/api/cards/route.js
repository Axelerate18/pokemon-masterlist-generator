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
    let privateKey = process.env.GOOGLE_PRIVATE_KEY
      .replace(/\\n/g, "\n")
      .replace(/\r?\n/g, "\n");

    // -------------------------------
    // CREATE JWT CLIENT
    // -------------------------------
    const auth = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      null,
      privateKey,
      ["https://www.googleapis.com/auth/spreadsheets"] // FULL SCOPE
    );

    console.log("DEBUG: Auth object created");

    // -------------------------------
    // OBTAIN ACCESS TOKEN
    // -------------------------------
    const accessToken = await auth.getAccessToken();

    if (!accessToken || accessToken.length < 30) {
      console.log("DEBUG ACCESS TOKEN INVALID:", accessToken);
      throw new Error("Access token missing or invalid");
    }

    console.log("DEBUG ACCESS TOKEN OK, length:", accessToken.length);

    // -------------------------------
    // DIRECT REST CALL TO SHEETS API
    // -------------------------------
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Data!A:Z`;

    const response = await fetch(url + "?majorDimension=ROWS", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const raw = await response.text();
      console.log("🔥 GOOGLE RAW ERROR:", raw);
      throw new Error(`Sheets API returned HTTP ${response.status}`);
    }

    const json = await response.json();
    console.log("DEBUG: Data returned successfully");

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