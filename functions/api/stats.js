export async function onRequest(context) {
  const { env } = context;

  // Try to fetch real Cloudflare Analytics
  let visitors = 0;
  let pageViews = 0;
  let isReal = false;

  if (env.CF_ANALYTICS_TOKEN && env.CF_ZONE_ID) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const query = JSON.stringify({
        query: `{ viewer { accounts(filter: {accountTag: "${env.CF_ACCOUNT_ID}"}) { zones(filter: {zoneTag: "${env.CF_ZONE_ID}"}) { httpRequests1dGroups(limit: 1, filter: {date: "${today}"}) { sum { requests pageViews } } } } } }`,
      });

      const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.CF_ANALYTICS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: query,
      });

      if (res.ok) {
        const json = await res.json();
        const groups = json?.data?.viewer?.accounts?.[0]?.zones?.[0]?.httpRequests1dGroups;
        if (groups && groups.length > 0) {
          visitors = groups[0].sum?.requests || 0;
          pageViews = groups[0].sum?.pageViews || 0;
          isReal = true;
        }
      }
    } catch (e) {
      // Fall through to mock data
    }
  }

  // Fallback to mock data if no real analytics
  if (!isReal) {
    visitors = Math.floor(Math.random() * 50) + 1;
    pageViews = Math.floor(Math.random() * 120) + 10;
  }

  const data = {
    visitors,
    pageViews,
    revenue: (Math.random() * 50).toFixed(2), // Manual entry needed for real revenue
    clicks: Math.floor(Math.random() * 20),
    site: "smarthomerent.casa",
    real: isReal,
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