export async function getAllItems() {
  const res = await fetch("http://localhost:5000/api/produit/tousLesProduits", {
    method: "GET",
  });
  console.log(res);
  if (!res.ok) {
    throw new Error("Erreur API inventaire");
  }
  return res.json();
}
