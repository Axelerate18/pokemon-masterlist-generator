import fetch from 'node-fetch';
import Papa from 'papaparse';

export async function fetchCards() {
  const res = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vRcbbI3WUWbmjXYay0BQKF7wJ5kR8RoHIXQoUbH4yWSzySeGib6VGtx_xSp7BLnVuF_7oOrnYi_sJfh/pub?gid=0&single=true&output=csv');
  const csvText = await res.text();

  // Parse CSV text to JSON
  const { data, errors } = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (errors.length) {
    console.error('CSV parse errors:', errors);
  }

  return data;
}
