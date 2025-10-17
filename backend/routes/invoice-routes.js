// backend/routes/invoice-routes.js
import express from "express";
import puppeteer from "puppeteer";

const router = express.Router();

// fonction pour calculer les taxes
function calcTaxes(items) {
  const subtotal = +items
    .reduce((s, it) => s + it.qty * it.unit_price, 0)
    .toFixed(2);
  const tps = +(subtotal * 0.05).toFixed(2);
  const tvq = +(subtotal * 0.09975).toFixed(2);
  const total = +(subtotal + tps + tvq).toFixed(2);
  return { subtotal, tps, tvq, total };
}

// fonction pour construire le HTML de la facture
function renderInvoiceHTML({ invoice, seller, customer, items, totals }) {
  const rows = items
    .map(
      (it) => `
        <tr>
          <td>${it.description}</td>
          <td style="text-align:right;">${it.qty}</td>
          <td style="text-align:right;">${it.unit_price.toFixed(2)} $</td>
          <td style="text-align:right;">${(it.qty * it.unit_price).toFixed(
            2
          )} $</td>
        </tr>`
    )
    .join("");

  return `
  <html lang="fr">
  <head>
    <meta charset="utf-8"/>
    <title>Facture ${invoice.number}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 30px; color: #222; }
      h1 { font-size: 22px; margin-bottom: 0; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      th, td { border-bottom: 1px solid #ddd; padding: 6px 8px; font-size: 13px; }
      th { text-align: left; background: #f4f4f4; }
      .right { text-align: right; }
      .totals { width: 250px; margin-left: auto; margin-top: 10px; }
      .totals td { border: none; padding: 4px; }
      .bold { font-weight: bold; }
    </style>
  </head>
  <body>
    <h1>FACTURE</h1>
    <p>No: ${invoice.number} | Date: ${invoice.date}</p>
    <p><b>Vendeur :</b> ${seller.name}<br>${seller.address}</p>
    <p><b>Client :</b> ${customer.name}<br>${customer.address}</p>

    <table>
      <thead>
        <tr>
          <th>Article</th>
          <th class="right">Qté</th>
          <th class="right">Prix</th>
          <th class="right">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <table class="totals">
      <tr><td class="right">Sous-total :</td><td class="right">${totals.subtotal.toFixed(
        2
      )} $</td></tr>
      <tr><td class="right">TPS (5%) :</td><td class="right">${totals.tps.toFixed(
        2
      )} $</td></tr>
      <tr><td class="right">TVQ (9,975%) :</td><td class="right">${totals.tvq.toFixed(
        2
      )} $</td></tr>
      <tr><td class="right bold">Total :</td><td class="right bold">${totals.total.toFixed(
        2
      )} $</td></tr>
    </table>

    <p>Merci pour votre achat!</p>
  </body>
  </html>`;
}

// route : POST /api/invoice
router.post("/", async (req, res) => {
  try {
    const {
      invoice = {
        number: "2025-0001",
        date: new Date().toISOString().slice(0, 10),
      },
      seller = { name: "Gestion Inventaire", address: "123 Rue X, Laval, QC" },
      customer = { name: "Thomas Garon", address: "Laval, QC" },
      items = [
        { description: "Gants SP-8 V3", qty: 1, unit_price: 139.99 },
        { description: "Livraison", qty: 1, unit_price: 12.0 },
      ],
    } = req.body || {};

    const totals = calcTaxes(items);
    const html = renderInvoiceHTML({
      invoice,
      seller,
      customer,
      items,
      totals,
    });

    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "16mm", right: "14mm", bottom: "16mm", left: "14mm" },
    });
    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="facture.pdf"');
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Erreur de génération PDF :", err);
    res.status(500).json({ error: "Erreur de génération PDF" });
  }
});

export default router;
