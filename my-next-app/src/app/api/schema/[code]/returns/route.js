import axios from "axios";
import dayjs from "dayjs";

let returnsCache = {}; // optional caching per code+params

export async function GET(req, { params }) {
  const { code } = params;
  const searchParams = req.nextUrl.searchParams;

  const period = searchParams.get("period");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const cacheKey = `${code}-${period || from}-${to}`;
  const TTL = 12 * 60 * 60 * 1000; // 12 hours
  const now = Date.now();

  try {
    // Check cache
    if (!returnsCache[cacheKey] || now - returnsCache[cacheKey].lastFetched > TTL) {
      // Fetch MF data
      const response = await axios.get(`https://api.mfapi.in/mf/${code}`);
      const mfData = response.data.data;

      // Determine start and end dates
      let startDate, endDate;
      if (period) {
        const periodMap = { "1m": 1, "3m": 3, "6m": 6, "1y": 12 };
        const months = periodMap[period];
        if (!months) throw new Error("Invalid period");
        endDate = dayjs().format("YYYY-MM-DD");
        startDate = dayjs().subtract(months, "month").format("YYYY-MM-DD");
      } else if (from && to) {
        startDate = from;
        endDate = to;
      } else {
        throw new Error("Provide either period or from/to dates");
      }

      // Find NAVs
      const startNAV = findNAV(mfData, startDate);
      const endNAV = findNAV(mfData, endDate);

      if (!startNAV || !endNAV) throw new Error("Invalid NAV data for the selected dates");

      // Calculate returns
      const simpleReturn = ((endNAV - startNAV) / startNAV) * 100;
      const years = dayjs(endDate).diff(dayjs(startDate), "day") / 365;
      const annualizedReturn = years >= 0.1 ? (Math.pow(endNAV / startNAV, 1 / years) - 1) * 100 : null;

      returnsCache[cacheKey] = {
        data: { startDate, endDate, startNAV, endNAV, simpleReturn, annualizedReturn },
        lastFetched: now,
      };
    }

    return new Response(JSON.stringify(returnsCache[cacheKey].data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error(`Error fetching returns for ${code}:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Helper function to find closest NAV on or before the date
function findNAV(data, date) {
  const entry = data.find(d => dayjs(d.date).isSameOrBefore(dayjs(date)));
  return entry ? parseFloat(entry.nav) : null;
}
