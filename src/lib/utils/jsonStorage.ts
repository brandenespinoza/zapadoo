export async function loadJSON(file: string) {
  const res = await fetch(`/data/${file}`);
  if (!res.ok) throw new Error(`Failed to load ${file}`);
  return res.json();
}
