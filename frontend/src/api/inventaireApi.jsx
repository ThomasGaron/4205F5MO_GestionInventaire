export async function getAllItems() {
  const res = await fetch("http://localhost:5000/api/items");
  if (!res.ok) {
    throw new Error("Erreur API inventaire");
  }
  return res.json();
}
