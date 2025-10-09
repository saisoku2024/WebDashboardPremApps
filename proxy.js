export default async function handler(req, res) {
  const url = "https://script.google.com/macros/s/AKfycbzUM_fABwBUjbOM0w6BgoiXm8YepWzeIeKaNOQ5u1lXwZpyM2v1ybuOmAZL2zKEplgO/exec";

  const response = await fetch(url, {
    method: req.method,
    headers: { "Content-Type": "application/json" },
    body: req.method === "POST" ? JSON.stringify(req.body) : undefined
  });

  const data = await response.text();
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).send(data);
}
