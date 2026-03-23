import axios from "axios";
import * as cheerio from "cheerio";

export interface TrackingEvent {
  date: string;
  status: string;
}

/**
 * Scrapes Domex tracking information for a given waybill number.
 * @param wbno The waybill number (e.g., EC705806740)
 */
export const getDomexTracking = async (wbno: string): Promise<TrackingEvent[]> => {
  try {
    const url = `https://domex.lk/Order-Details.php?wbno=${wbno}`;
    
    // We use a browser-like User Agent to avoid being blocked
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    const $ = cheerio.load(data);

    // Domex tracking info is typically in a table that contains "TRACKING INFORMATION"
    const table = $("table").filter((_, el) => {
      return $(el).text().includes("TRACKING INFORMATION");
    });

    if (table.length === 0) {
      console.warn(`No tracking table found for WBNO: ${wbno}`);
      return [];
    }

    const events: TrackingEvent[] = [];
    table.find("tr").each((index, el) => {
      // The first row is the main "TRACKING INFORMATION" header
      // The second row is the sub-headers (Date / Time, Status)
      if (index < 2) return;

      const cells = $(el).find("td");
      if (cells.length >= 2) {
        const date = $(cells[0]).text().trim();
        const status = $(cells[1]).text().trim();

        if (date && status) {
          events.push({ date, status });
        }
      }
    });

    return events;
  } catch (error: any) {
    console.error(`Error scraping Domex tracking (${wbno}):`, error.message);
    throw new Error(`Tracking fetch failed: ${error.message}`);
  }
};
