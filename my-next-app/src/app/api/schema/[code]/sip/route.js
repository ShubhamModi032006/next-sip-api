import axios from "axios";
import dayjs from "dayjs";

let sipCache = {}; // optional caching per code+body

export async function POST(req, { params }) {
  const { code } = params;

  try {
    const body = await req.json();
    const { amount, frequency = "monthly", from, to } = body;

    if (!amount || !from || !to) {
      throw new Error("amount, from, and to are required in body");
    }

    const cacheKey = `${code}-${amount}-${frequency}-${from}-${to}`;
    const TTL = 12 * 60 * 60 * 1000; // 12 hours
    const now = Date.now();

    if (!sipCache[cacheKey] || now - sipCache[cacheKey].lastFetched > TTL) {
      // Fetch NAV data
      const response = await axios.get(`https://api.mfapi.in/mf/${code}`);
      const navHistory = response.data.data.slice().reverse(); // chronological order

      let sipDate = dayjs(from);
      const endDate = dayjs(to);
      let totalInvested = 0,
        totalUnits = 0;

      // Determine frequency increment
      const freqMap = { monthly: 1, quarterly: 3, yearly: 12 };
      const monthIncrement = freqMap[frequency.toLowerCase()] || 1;

      while (sipDate.isBefore(endDate) || sipDate.isSame(endDate)) {
        const nav = findNAV(navHistory, sipDate.format("YYYY-MM-DD"));
        if (nav) {
          const units = amount / nav;
          totalUnits += units;
          totalInvested += amount;
        }
        sipDate = sipDate.add(monthIncrement, "month");
      }

      const latestNAV = parseFloat(navHistory[navHistory.length - 1].nav);
      const currentValue = totalUnits * latestNAV;

      const absoluteReturn = ((currentValue - totalInvested) / totalInvested) * 100;
      const years = endDate.diff(dayjs(from), "day") / 365;
      const annualizedReturn =
        years > 0 ? (Math.pow(currentValue / totalInvested, 1 / years) - 1) * 100 : null;

      sipCache[cacheKey] = {
        data: { totalInvested, currentValue, totalUnits, absoluteReturn, annualizedReturn },
        lastFetched: now,
      };
    }

    return new Response(JSON.stringify(sipCache[cacheKey].data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`SIP calculation error for ${code}:`, error.message);
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
