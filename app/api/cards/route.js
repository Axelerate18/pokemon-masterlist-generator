import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Normalize private key
    const privateKey = process.env.GOOGLE_PRIVATE_KEY
      .replace(/\\n/g, '\n')
      .replace(/\r?\n/g, '\n');

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
