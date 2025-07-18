import { NextResponse } from 'next/server';
import Papa from 'papaparse';

export async function GET() {
  const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRcbbI3WUWbmjXYay0BQKF7wJ5kR8RoHIXQoUbH4yWSzySeGib6VGtx_xSp7BLnVuF_7oOrnYi_sJfh/pub?gid=0&single=true&output=csv';

  try {
    const res = await fetch(csvUrl);
    if (!res.ok) throw new Error(`Failed to fetch CSV: ${res.status}`);

    const text = await res.text();

    const { data } = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching or parsing CSV:', error);
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 });
  }
}
