import axios from "axios";
import dayjs from "dayjs";

let swpCache = {};

export async function POST(req, { params }) {
  const { code } = params;

  try {
    const body = await req.json();
    const { initialInvestment, withdrawalAmount, frequency = "monthly", from, to } = body;

    if (!initialInvestment || !withdrawalAmount || !from || !to) {
      throw new Error("initialInvestment, withdrawalAmount, from, and to are required in body");
    }

    const cacheKey = `${code}-${initialInvestment}-${withdrawalAmount}-${frequency}-${from}-${to}`;
    const TTL = 12 * 60 * 60 * 1000; // 12 hours
    const now = Date.now();

    if (!swpCache[cacheKey] || now - swpCache[cacheKey].lastFetched > TTL) {
      // Fetch NAV data
      const response = await axios.get(`https://api.mfapi.in/mf/${code}`);
      const navHistory = response.data.data.slice().reverse(); // chronological order

      // Find initial NAV
      const initialNAV = findNAV(navHistory, from);
      if (!initialNAV || initialNAV <= 0) {
        throw new Error("Invalid NAV data for the start date");
      }

      // Calculate initial units
      let remainingUnits = initialInvestment / initialNAV;
      let totalWithdrawn = 0;
      let withdrawalHistory = [];
      
      let swpDate = dayjs(from);
      const endDate = dayjs(to);

      // Determine frequency increment
      const freqMap = { monthly: 1, quarterly: 3, yearly: 12 };
      const monthIncrement = freqMap[frequency.toLowerCase()] || 1;

      // Start withdrawals from the next period
      swpDate = swpDate.add(monthIncrement, "month");

      while (swpDate.isBefore(endDate) || swpDate.isSame(endDate)) {
        const currentNAV = findNAV(navHistory, swpDate.format("YYYY-MM-DD"));
        
        if (currentNAV && currentNAV > 0 && remainingUnits > 0) {
          // Calculate units to redeem for withdrawal
          const unitsToRedeem = Math.min(withdrawalAmount / currentNAV, remainingUnits);
          const actualWithdrawal = unitsToRedeem * currentNAV;
          
          remainingUnits -= unitsToRedeem;
          totalWithdrawn += actualWithdrawal;
          
          withdrawalHistory.push({
            date: swpDate.format("YYYY-MM-DD"),
            nav: currentNAV,
            unitsRedeemed: unitsToRedeem,
            withdrawalAmount: actualWithdrawal,
            remainingUnits: remainingUnits,
            portfolioValue: remainingUnits * currentNAV
          });

          // If no units left, break
          if (remainingUnits <= 0.001) {
            break;
          }
        }
        
        swpDate = swpDate.add(monthIncrement, "month");
      }

      // Calculate final portfolio value
      const finalNAV = findNAV(navHistory, endDate.format("YYYY-MM-DD")) || 
                      navHistory[navHistory.length - 1]?.nav;
      const finalPortfolioValue = remainingUnits * parseFloat(finalNAV);
      
      // Calculate total value received (withdrawals + remaining portfolio)
      const totalValueReceived = totalWithdrawn + finalPortfolioValue;
      const totalReturn = totalValueReceived - initialInvestment;
      const totalReturnPercentage = (totalReturn / initialInvestment) * 100;

      // Calculate duration and annualized return
      const durationYears = endDate.diff(dayjs(from), "day") / 365;
      const annualizedReturn = durationYears > 0 ? 
        (Math.pow(totalValueReceived / initialInvestment, 1 / durationYears) - 1) * 100 : null;

      swpCache[cacheKey] = {
        data: {
          initialInvestment,
          initialUnits: initialInvestment / initialNAV,
          totalWithdrawn,
          remainingUnits,
          finalPortfolioValue,
          totalValueReceived,
          totalReturn,
          totalReturnPercentage,
          annualizedReturn,
          withdrawalHistory,
          initialNAV,
          finalNAV: parseFloat(finalNAV),
          withdrawalsCount: withdrawalHistory.length
        },
        lastFetched: now,
      };
    }

    return new Response(JSON.stringify(swpCache[cacheKey].data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`SWP calculation error for ${code}:`, error.message);
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
