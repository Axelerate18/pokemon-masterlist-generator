import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 🔥 DEBUG ENV VARS
    console.log("DEBUG EMAIL:", process.env.GOOGLE_CLIENT_EMAIL);
    console.log("DEBUG SHEET:", process.env.GOOGLE_SHEET_ID);

    if (!process.env.GOOGLE_PRIVATE_KEY) {
      console.log("DEBUG KEY: MISSING");
    } else {
      console.log("DEBUG KEY LENGTH:", process.env.GOOGLE_PRIVATE_KEY.length);
      console.log("DEBUG KEY FIRST 40:", process.env.GOOGLE_PRIVATE_KEY.slice(0, 40));
      console.log("DEBUG KEY LAST 40:", process.env.GOOGLE_PRIVATE_KEY.slice(-40));
    }

    // Normalize private key
    let privateKey = process.env.GOOGLE_PRIVATE_KEY || "";
    privateKey = privateKey
      .replace(/\\n/g, "\n") // convert escaped newlines to actual
      .replace(/\r?\n/g, "\n"); // ensure consistent line breaks

    const auth = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      null,
      privateKey,
      ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    );

    console.log("DEBUG: Auth object created");

    const sheets = google.sheets({ version: "v4", auth });

    console.log("DEBUG: Sheets client created");

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Data!A:Z",
    });

    console.log("DEBUG: Sheets API responded");

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("DEBUG: No data rows found");
      return NextResponse.json([]);
    }

    const headers = rows[0];
    const data = rows.slice(1).map((row) => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] ?? "";
      });
      return obj;
    });

    return NextResponse.json(data);

  } catch (error) {
    console.error("🔥 GOOGLE API ERROR:", error);
    return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
  }
}
