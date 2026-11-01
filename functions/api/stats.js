export async function onRequest(context) {
  const data = {
    visitors: Math.floor(Math.random() * 50) + 1,
    pageViews: Math.floor(Math.random() * 120) + 10,
    revenue: (Math.random() * 50).toFixed(2),
    clicks: Math.floor(Math.random() * 20),
    site: "smarthomerent.casa",
    updated: new Date().toISOString(),
  };

  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Cache-Control": "no-cache",
    },
  });
}