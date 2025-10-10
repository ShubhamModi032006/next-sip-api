// app/api/scheme/[code]/route.js
import axios from "axios";
import dayjs from 'dayjs';

let schemeCache = {};

export async function GET(req, { params }) {
  const { code } = await params; // dynamic route param
  const TTL = 30 * 60 * 1000; // 30 minutes for better data freshness
  const now = Date.now();

  try {
    // Check cache
    if (!schemeCache[code] || now - schemeCache[code].lastFetched > TTL) {
      const response = await axios.get(`https://api.mfapi.in/mf/${code}`, {
        timeout: 10000, // 10 second timeout
        headers: {
          'User-Agent': 'MutualFundCalculator/1.0'
        }
      });
      
      // Clean and validate data
      let cleanData = response.data;
      if (cleanData.data && Array.isArray(cleanData.data)) {
        cleanData.data = cleanData.data.filter(item => {
          const isValidDate = dayjs(item.date, 'DD-MM-YYYY', true).isValid();
          const navValue = parseFloat(item.nav);
          const isValidNav = !isNaN(navValue) && navValue > 0;
          return isValidDate && isValidNav;
        });
      }
      
      schemeCache[code] = { 
        data: cleanData, 
        lastFetched: now,
        dataCount: cleanData.data ? cleanData.data.length : 0
      };
    }

    return new Response(JSON.stringify(schemeCache[code].data), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=1800", // 30 minutes
        "X-Data-Count": schemeCache[code].dataCount?.toString() || "0"
      },
    });
  } catch (error) {
    console.error(`MF scheme fetch error for ${code}:`, error.message);
    
    // Return cached data if available, even if expired
    if (schemeCache[code]) {
      console.log(`Returning cached data for ${code} due to API error`);
      return new Response(JSON.stringify(schemeCache[code].data), {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "X-Cache-Status": "stale"
        },
      });
    }
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch scheme data", 
        details: error.message,
        code: code
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
