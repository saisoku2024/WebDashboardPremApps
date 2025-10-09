// === Proxy Gateway untuk SAISOKU Dashboard ===
// Kompatibel dengan Netlify Functions (Node runtime)
// by SIVA · saisoku.id

export async function handler(event, context) {
  const target =
    "https://script.google.com/macros/s/AKfycbwP-bsyxT_TJaVkTZzv5uNR2yd_bcvJ4V4gPF4dysiFf_lxBSd4VVekiSl_ulxjxp0H/exec";

  // CORS Header
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "OK" };
  }

  try {
    const init = {
      method: event.httpMethod,
      headers: { "Content-Type": "application/json" },
    };

    if (event.httpMethod === "POST") {
      init.body = event.body;
    }

    const response = await fetch(target, init);
    const text = await response.text();

    return {
      statusCode: response.status,
      headers: corsHeaders,
      body: text,
    };
  } catch (err) {
    console.error("Proxy Error:", err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
