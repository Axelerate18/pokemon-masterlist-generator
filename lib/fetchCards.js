export async function fetchCards() {
  const res = await fetch("/api/cards");

  if (!res.ok) {
    throw new Error("Failed to fetch cards");
  }

  const data = await res.json();
  return data.cards;
}