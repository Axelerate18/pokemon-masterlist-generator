import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Normalize private key for both local and Vercel
    const privateKey = process.env.GOOGLE_PRIVATE_KEY
      .replace(/\\n/g, '\n')     // for escaped \n (local dev)
      .replace(/\r?\n/g, '\n');  // ensure proper formatting (Vercel)

    const auth = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      null,
      privateKey,
      ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    );

    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Data!A:Z",
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
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
    console.error("Google Sheets API error:", error);
    return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
  }
}


