// app/api/scheme/[code]/route.js
import axios from "axios";

let schemeCache = {};

export async function GET(req, { params }) {
  const { code } = params; // dynamic route param
  const TTL = 12 * 60 * 60 * 1000; // 12 hours
  const now = Date.now();

  try {
    // Check cache
    if (!schemeCache[code] || now - schemeCache[code].lastFetched > TTL) {
      const response = await axios.get(`https://api.mfapi.in/mf/${code}`);
      schemeCache[code] = { data: response.data, lastFetched: now };
    }

    return new Response(JSON.stringify(schemeCache[code].data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`MF scheme fetch error for ${code}:`, error.message);
    return new Response(
      JSON.stringify({ error: "Failed to fetch scheme data" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
