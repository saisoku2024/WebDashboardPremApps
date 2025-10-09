// proxy.js — Netlify Function for SAISOKU Dashboard
export default async function handler(req, res) {
  const target = "https://script.google.com/macros/s/AKfycbwP-bsyxT_TJaVkTZzv5uNR2yd_bcvJ4V4gPF4dysiFf_lxBSd4VVekiSl_ulxjxp0H/exec";

  const init = {
    method: req.method,
    headers: { "Content-Type": "application/json" },
  };

  if (req.method === "POST") {
    init.body = JSON.stringify(req.body);
  }

  const response = await fetch(target, init);
  const text = await response.text();

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  res.status(200).send(text);
}
