// app/api/mf/route.js
import axios from "axios";

let cache = { data: null, lastFetched: 0 };

export async function GET(req) {
  const TTL = 12 * 60 * 60 * 1000; // 12 hours
  const now = Date.now();

  try {
    if (!cache.data || now - cache.lastFetched > TTL) {
      const response = await axios.get("https://api.mfapi.in/mf");
      cache = { data: response.data, lastFetched: now };
    }
    return new Response(JSON.stringify(cache.data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("MF API fetch error:", error.message);
    return new Response(
      JSON.stringify({ error: "Failed to fetch data from MF API" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
