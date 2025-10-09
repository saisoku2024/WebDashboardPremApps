// === Proxy untuk SAISOKU Dashboard ===
// Bypass CORS + Forward POST/GET ke Google Apps Script

export default async (req, res) => {
  const target = "https://script.google.com/macros/s/AKfycbwP-bsyxT_TJaVkTZzv5uNR2yd_bcvJ4V4gPF4dysiFf_lxBSd4VVekiSl_ulxjxp0H/exec";

  const init = {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (req.method === "POST") {
    try {
      const chunks = [];
      for await (const chunk of req.body) chunks.push(chunk);
      init.body = Buffer.concat(chunks).toString();
    } catch (err) {
      console.error("Body parse error:", err);
    }
  }

  try {
    const response = await fetch(target, init);
    const text = await response.text();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    res.status(response.status).send(text);
  } catch (err) {
    console.error("Proxy fetch error:", err);
    res.status(500).send("Error forwarding request: " + err.message);
  }
};
