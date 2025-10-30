// backend/routes/invoice-routes.js
import express from "express";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

// ---------- Utils chemin / dossier invoices ----------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const INVOICE_DIR = path.join(__dirname, "..", "invoices");
if (!fs.existsSync(INVOICE_DIR)) fs.mkdirSync(INVOICE_DIR);

// Petit compteur persistant pour un numéro unique (remplace par DB si tu veux)
const COUNTER_FILE = path.join(INVOICE_DIR, "_counter.txt");
function getNextInvoiceNumber() {
  let n = 1;
  if (fs.existsSync(COUNTER_FILE)) {
    n = parseInt(fs.readFileSync(COUNTER_FILE, "utf8") || "0", 10) + 1;
  }
  fs.writeFileSync(COUNTER_FILE, String(n));
  const year = new Date().getFullYear();
  return `${year}-${String(n).padStart(6, "0")}`; // ex: 2025-000123
}

// ---------- Calcul taxes (QC) ----------
function calcTaxes(items) {
  const subtotal = +items
    .reduce((s, it) => s + it.qty * it.unit_price, 0)
    .toFixed(2);
  const tps = +(subtotal * 0.05).toFixed(2);
  const tvq = +(subtotal * 0.09975).toFixed(2);
  const total = +(subtotal + tps + tvq).toFixed(2);
  return { subtotal, tps, tvq, total };
}

// ---------- Template HTML ----------
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
    </tr>
  `
    )
    .join("");

  return `
  <!doctype html>
  <html lang="fr">
  <head>
    <meta charset="utf-8"/>
    <title>Facture ${invoice.number}</title>
    <style>
      @page { size: A4; margin: 16mm 14mm 16mm 14mm; }
      html, body { width: 210mm; margin: 0; padding: 0; }
      body { font-family: Arial, Helvetica, sans-serif; -webkit-print-color-adjust: exact; color: #111; }
      h1 { font-size: 18pt; margin: 0 0 6mm; }
      table { width: 100%; border-collapse: collapse; margin-top: 4mm; }
      th, td { border-bottom: 1px solid #e5e5e5; padding: 3.5mm; font-size: 10.5pt; }
      th { text-align: left; background: #fafafa; }
      .right { text-align: right; }
      .totals { width: 70mm; margin-left: auto; margin-top: 4mm; }
      .totals td { border: none; padding: 2mm 0; font-size: 11pt; }
      .bold { font-weight: 700; }
    </style>
  </head>
  <body>
    <h1>FACTURE</h1>
    <div>No: ${invoice.number} &nbsp; | &nbsp; Date: ${invoice.date}</div>

    <div style="margin-top:6mm">
      <div><b>Vendeur :</b> ${seller.name}</div>
      <div>${seller.address}</div>
      ${seller.gst ? `<div># TPS: ${seller.gst}</div>` : ``}
      ${seller.qst ? `<div># TVQ: ${seller.qst}</div>` : ``}
    </div>

    <div style="margin-top:4mm">
      <div><b>Client :</b> ${customer.name}</div>
      ${customer.address ? `<div>${customer.address}</div>` : ``}
      ${customer.email ? `<div>${customer.email}</div>` : ``}
    </div>

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

    <p style="margin-top:8mm;">Merci pour votre achat!</p>
  </body>
  </html>`;
}

// ---------- 1) Route historique : renvoie le PDF directement ----------
// POST /api/invoice
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
    await page.emulateMediaType("print");
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "16mm", right: "14mm", bottom: "16mm", left: "14mm" },
    });
    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="facture-${invoice.number}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Erreur de génération PDF :", err);
    res.status(500).json({ error: "Erreur de génération PDF" });
  }
});

// ---------- 2) Nouvelle route : génère (optionnellement sauvegarde) et renvoie une URL ----------
// POST /api/invoice/from-payload[?save=1]
router.post("/from-payload", async (req, res) => {
  try {
    const { customer, items = [], seller } = req.body || {};
    if (!customer?.name || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ error: "Payload invalide (customer/items requis)" });
    }

    const invoiceNo = getNextInvoiceNumber();
    const invoice = {
      number: invoiceNo,
      date: new Date().toISOString().slice(0, 10),
    };
    const sellerInfo = seller || {
      name: "Gestion Inventaire",
      address: "123 Rue X, Laval, QC",
      gst: "123456789 RT0001",
      qst: "1234567890 TQ0001",
    };

    const totals = calcTaxes(items);
    const html = renderInvoiceHTML({
      invoice,
      seller: sellerInfo,
      customer,
      items,
      totals,
    });

    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.emulateMediaType("print");
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "16mm", right: "14mm", bottom: "16mm", left: "14mm" },
    });
    await browser.close();

    // ?save=1 => on sauvegarde dans /invoices et on renvoie l'URL publique
    if (String(req.query.save) === "1") {
      const filename = `facture-${invoiceNo}.pdf`;
      const filepath = path.join(INVOICE_DIR, filename);
      fs.writeFileSync(filepath, pdfBuffer);
      return res.json({
        ok: true,
        invoiceNo,
        invoiceUrl: `/invoices/${filename}`,
      });
    }

    // sinon, on renvoie le PDF directement
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="facture-${invoiceNo}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (e) {
    console.error("from-payload error:", e);
    res.status(500).json({ error: "Erreur génération facture" });
  }
});

export default router;
