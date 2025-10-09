// === Proxy Gateway untuk SAISOKU Dashboard ===
// Fungsi ini meneruskan GET & POST ke Google Apps Script

export default async (req, res) => {
  const target =
    "https://script.google.com/macros/s/AKfycbwHlDDaRAp8rJ1oGiJXd2S8KQMs7CinvLIBj4FsCX_eI7OwLSJtbH-iR3qNwke5PQqJ/exec";

  // Set header CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).send("OK");
  }

  try {
    const init = {
      method: req.method,
      headers: { "Content-Type": "application/json" },
    };

    if (req.method === "POST") {
      let body = "";
      for await (const chunk of req.body) body += chunk;
      init.body = body;
    }

    const response = await fetch(target, init);
    const text = await response.text();

    res.status(response.status).send(text);
  } catch (err) {
    console.error("Proxy Error:", err);
    res.status(500).send("Proxy Error: " + err.message);
  }
};
