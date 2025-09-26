import axios from "axios";
import dayjs from "dayjs";

let lumpsumCache = {};

export async function POST(req, { params }) {
  const { code } = params;

  try {
    const body = await req.json();
    const { amount, from, to } = body;

    if (!amount || !from || !to) {
      throw new Error("amount, from, and to are required in body");
    }

    const cacheKey = `${code}-${amount}-${from}-${to}`;
    const TTL = 12 * 60 * 60 * 1000; // 12 hours
    const now = Date.now();

    if (!lumpsumCache[cacheKey] || now - lumpsumCache[cacheKey].lastFetched > TTL) {
      // Fetch NAV data
      const response = await axios.get(`https://api.mfapi.in/mf/${code}`);
      const navHistory = response.data.data;

      // Find NAVs for start and end dates
      const startNAV = findNAV(navHistory, from);
      const endNAV = findNAV(navHistory, to);

      if (!startNAV || !endNAV || startNAV <= 0) {
        throw new Error("Invalid NAV data for the selected dates");
      }

      const units = amount / startNAV;
      const currentValue = units * endNAV;
      const absoluteReturn = ((currentValue - amount) / amount) * 100;
      
      const years = dayjs(to).diff(dayjs(from), "day") / 365;
      const annualizedReturn = years > 0 ? (Math.pow(currentValue / amount, 1 / years) - 1) * 100 : null;

      // Generate growth history for charting
      const growthHistory = [];
      const sortedNavHistory = navHistory.slice().reverse(); // chronological order
      
      for (const navEntry of sortedNavHistory) {
        const entryDate = dayjs(navEntry.date);
        if (entryDate.isSameOrAfter(dayjs(from)) && entryDate.isSameOrBefore(dayjs(to))) {
          const nav = parseFloat(navEntry.nav);
          if (nav > 0) {
            growthHistory.push({
              date: navEntry.date,
              value: units * nav,
              nav: nav
            });
          }
        }
      }

      lumpsumCache[cacheKey] = {
        data: {
          investedAmount: amount,
          currentValue,
          units,
          absoluteReturn,
          annualizedReturn,
          startNAV,
          endNAV,
          growthHistory
        },
        lastFetched: now,
      };
    }

    return new Response(JSON.stringify(lumpsumCache[cacheKey].data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`Lumpsum calculation error for ${code}:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Helper function to find closest NAV on or before the date
function findNAV(data, date) {
  const entry = data.find((d) => dayjs(d.date).isSameOrBefore(dayjs(date)));
  return entry ? parseFloat(entry.nav) : null;
}
