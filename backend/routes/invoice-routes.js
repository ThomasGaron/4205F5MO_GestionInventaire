import express from "express";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { supabase } from "../util/db2.js";

const router = express.Router();

/* =============================================================================
   CONSTANTES : vendeur (figé) + mise en forme
============================================================================= */
const SELLER = {
  name: "Gestion Inventaire",
  address: "123 Rue X, Laval, QC",
  gst: "TPS 123456789 RT0001",
  qst: "TVQ 1234567890 TQ0001",
};

const BRAND = {
  accent: "#ff8a2a",
  // siteUrl: "",
};

const LOGO_SVG = `
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff8a2a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
`;

/* =============================================================================
   Dossier invoices (optionnel si ?save=1)
============================================================================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const INVOICE_DIR = path.join(__dirname, "..", "invoices");
if (!fs.existsSync(INVOICE_DIR)) fs.mkdirSync(INVOICE_DIR, { recursive: true });

const isUUID = (s) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(s || "")
  );

/* =============================================================================
   Taxes QC
============================================================================= */
function calcTaxes(items) {
  const subtotal = +items
    .reduce((s, it) => s + Number(it.qty || 0) * Number(it.unit_price || 0), 0)
    .toFixed(2);
  const tps = +(subtotal * 0.05).toFixed(2);
  const tvq = +(subtotal * 0.09975).toFixed(2);
  const total = +(subtotal + tps + tvq).toFixed(2);
  return { subtotal, tps, tvq, total };
}

/* =============================================================================
   Template HTML
============================================================================= */
function renderInvoiceHTML({ invoice, seller, customer, items, totals }) {
  const rows = items
    .map(
      (it, i) => `
        <tr class="${i % 2 ? "zebra" : ""}">
          <td>${it.description}</td>
          <td class="num">${it.qty}</td>
          <td class="num">${Number(it.unit_price).toFixed(2)} $</td>
          <td class="num">${(Number(it.qty) * Number(it.unit_price)).toFixed(
            2
          )} $</td>
        </tr>`
    )
    .join("");

  const siteLink =
    BRAND.siteUrl && BRAND.siteUrl.trim()
      ? `<a class="link" href="${BRAND.siteUrl}" target="_blank">${BRAND.siteUrl}</a>`
      : "";

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<title>Facture ${invoice.number}</title>
<style>
  @page { size: A4; margin: 16mm 14mm; }
  html, body { margin:0; padding:0; }
  body { font-family: Arial, Helvetica, sans-serif; color:#111; -webkit-print-color-adjust: exact; }

  .header { display:flex; align-items:center; justify-content:space-between;
    border:1px solid #eaeaea; border-radius:10px; padding:10px 12px; margin-bottom:12px;
    background: ${BRAND.accent}1a; }
  .brand { display:flex; gap:8px; align-items:center; font-weight:700; }
  .brand-name { color:#111; }
  h1 { margin: 8px 0 4px; color:${BRAND.accent}; font-size: 18pt; }
  .meta { display:flex; gap:16px; font-size: 12px; color:#444; }

  .cards { display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-top:10px; }
  .card { border:1px solid #eaeaea; border-radius:10px; padding:10px; }
  .card .title { font-weight:700; margin-bottom:6px; color:#222; }
  .muted { color:#555; font-size: 12px; }
  .link { color:${BRAND.accent}; text-decoration:none; }

  table { width:100%; border-collapse: collapse; margin-top:12px; }
  th, td { border-bottom: 1px solid #eee; padding:8px; font-size: 11pt; }
  th { text-align:left; background:#f7f7f7; }
  .zebra td { background:#fcfcfc; }
  .num { text-align:right; white-space:nowrap; }

  .totals { width:50%; margin-left:auto; margin-top:10px; }
  .totals td { border:none; padding:6px 0; }
  .totals .grand td { border-top:1px solid #eee; font-weight:700; }

  .small { font-size: 11px; color:#666; }

  .signature-wrap{ display:flex; justify-content:flex-end; margin-top:32px; }
  .sig-box{ width:360px; border:1px solid #d8dee4; border-radius:10px; padding:12px 14px 20px; background:#fafcff; }
  .sig-heading{ font-weight:600; color:#0f172a; margin:0 0 10px 0; font-size:12.5px; letter-spacing:.2px; }
  .sig-line{ width:100%; height:34px; border-bottom:1.5px dashed #94a3b8; margin-bottom:10px; }
  .sig-meta{ display:flex; align-items:center; justify-content:space-between; font-size:11px; color:#475569; }
</style>
</head>
<body>
  <div class="header">
    <div class="brand">
      ${LOGO_SVG}
      <span class="brand-name">${seller.name}</span>
    </div>
    <div class="small">${siteLink}</div>
  </div>

  <h1>Facture</h1>
  <div class="meta">
    <div><b>No :</b> ${invoice.number}</div>
    <div><b>Date :</b> ${invoice.date}</div>
  </div>

  <div class="cards">
    <div class="card">
      <div class="title">Vendeur</div>
      <div>${seller.name}</div>
      <div class="muted">${seller.address}</div>
      ${seller.gst ? `<div class="muted">${seller.gst}</div>` : ``}
      ${seller.qst ? `<div class="muted">${seller.qst}</div>` : ``}
    </div>
    <div class="card">
      <div class="title">Client</div>
      <div>${customer.name}</div>
      ${customer.address ? `<div class="muted">${customer.address}</div>` : ``}
      ${
        customer.email
          ? `<div class="muted">Courriel : <a class="link" href="mailto:${customer.email}">${customer.email}</a></div>`
          : ``
      }
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="num">Qté</th>
        <th class="num">Prix unit.</th>
        <th class="num">Montant</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <table class="totals">
    <tr><td class="num">Sous-total</td><td class="num">${totals.subtotal.toFixed(
      2
    )} $</td></tr>
    <tr><td class="num">TPS (5%)</td><td class="num">${totals.tps.toFixed(
      2
    )} $</td></tr>
    <tr><td class="num">TVQ (9,975%)</td><td class="num">${totals.tvq.toFixed(
      2
    )} $</td></tr>
    <tr class="grand"><td class="num">Total</td><td class="num">${totals.total.toFixed(
      2
    )} $</td></tr>
  </table>

  <p class="small" style="margin-top:10px;">
    Conditions : Payable sous 30 jours • Veuillez effectuer le paiement par chèque ou virement bancaire.<br/>
    <a class="link" href="mailto:factures@gestion-inventaire.com">factures@gestion-inventaire.com</a>
  </p>

  <div class="signature-wrap">
    <div class="sig-box">
      <div class="sig-heading">Signature du client</div>
      <div class="sig-line"></div>
      <div class="sig-meta">
        <div>Date : ______________________</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/* =============================================================================
   TEST simple pour valider Chromium sur Render
   GET /api/invoice/_test
============================================================================= */
router.get("/_test", async (req, res, next) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(
      `<h1 style="font-family:Arial;color:#ff8a2a">Test PDF OK ✅</h1>`,
      {
        waitUntil: "networkidle0",
      }
    );
    const pdf = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();
    res.setHeader("Content-Type", "application/pdf");
    return res.send(pdf);
  } catch (e) {
    try {
      if (browser) await browser.close();
    } catch {}

    console.error("Erreur _test invoice:", e);

    // TEMPORAIREMENT : renvoyer l'erreur brute au lieu de passer par le handler global
    return res.status(500).json({
      error: e.message || "Erreur inconnue",
      name: e.name,
      stack: e.stack,
    });
  }
});

/* =============================================================================
   Générer une facture depuis une commande
   GET /api/invoice/from-commande/:id[?save=1]
============================================================================= */
router.get("/from-commande/:id", async (req, res, next) => {
  let browser;
  try {
    const commandeId = String(req.params.id || "").trim();
    if (!isUUID(commandeId)) {
      return res.status(400).json({ error: "ID commande invalide." });
    }

    const { data: cmd, error: errCmd } = await supabase
      .from("commandes")
      .select("id, client_id, date, statut")
      .eq("id", commandeId)
      .single();
    if (errCmd || !cmd)
      return res.status(404).json({ error: "Commande introuvable." });

    const { data: lignes, error: errLignes } = await supabase
      .from("commande_produit")
      .select("produit_id, commande_produit_quantite, prix_unitaire")
      .eq("commande_id", commandeId);
    if (errLignes) return res.status(400).json({ error: errLignes.message });
    if (!lignes || lignes.length === 0) {
      return res.status(400).json({ error: "Commande sans lignes." });
    }

    const ids = [...new Set(lignes.map((l) => l.produit_id))];
    const { data: produits, error: errProd } = await supabase
      .from("produits")
      .select("id, produit_nom")
      .in("id", ids);
    if (errProd) return res.status(400).json({ error: errProd.message });
    const byId = new Map((produits || []).map((p) => [p.id, p]));

    const { data: client } = await supabase
      .from("clients")
      .select("client_nom, client_prenom, client_email, client_adresse")
      .eq("id", cmd.client_id)
      .single();

    const items = (lignes || []).map((l) => ({
      description: byId.get(l.produit_id)?.produit_nom || l.produit_id,
      qty: Number(l.commande_produit_quantite || 0),
      unit_price: Number(l.prix_unitaire || 0),
    }));

    const invoice = {
      number: `INV-${String(cmd.id).slice(0, 8)}`,
      date: cmd.date || new Date().toISOString().slice(0, 10),
    };

    const customer = {
      name:
        (client
          ? `${client.client_prenom || ""} ${client.client_nom || ""}`.trim()
          : cmd.client_id) || cmd.client_id,
      address: client?.client_adresse || "",
      email: client?.client_email || "",
    };

    const totals = calcTaxes(items);
    const html = renderInvoiceHTML({
      invoice,
      seller: SELLER,
      customer,
      items,
      totals,
    });

    // ---- Puppeteer (flags Render) + fermeture propre
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.emulateMediaType("print");
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "16mm", right: "14mm", bottom: "16mm", left: "14mm" },
    });

    await browser.close();

    if (String(req.query.save) === "1") {
      const filename = `facture-${invoice.number}.pdf`;
      const filepath = path.join(INVOICE_DIR, filename);
      fs.writeFileSync(filepath, pdfBuffer);
      return res.json({
        ok: true,
        invoiceNo: invoice.number,
        invoiceUrl: `/invoices/${filename}`,
        commandeId: cmd.id,
      });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="facture-${invoice.number}.pdf"`
    );
    return res.send(pdfBuffer);
  } catch (e) {
    try {
      if (browser) await browser.close();
    } catch {}
    console.error("Erreur facture commande:", e);
    return next(e); // Laisse le handler global formatter la réponse
  }
});

export default router;
