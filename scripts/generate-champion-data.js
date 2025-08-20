/* eslint-disable */
const puppeteer = require("puppeteer");
const fs = require("fs/promises");
const path = require("path");

// Load champion list from src/data/champions.json and derive metasrc slugs from imageKey
const CHAMPIONS_FILE = path.resolve(process.cwd(), "src/data/champions.json");

// Configuration for scraping
const CONFIG = {
  maxRetries: 3,           // Maximum number of retry attempts per champion
  minDelay: 2000,          // Minimum delay between requests in ms (2 seconds)
  maxDelay: 5000,          // Maximum delay between requests in ms (5 seconds)
  timeout: 45000,          // Page navigation timeout in ms (45 seconds)
  waitUntil: "networkidle2" // Navigation wait condition
};

// List of user agents to rotate
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
];

/**
 * Gets a random user agent from the predefined list
 * @returns {string} A random user agent string
 */
function getRandomUserAgent() {
  const index = Math.floor(Math.random() * USER_AGENTS.length);
  return USER_AGENTS[index];
}

/**
 * Generates a random delay within the configured range
 * @returns {number} Milliseconds to delay
 */
function getRandomDelay() {
  return Math.floor(Math.random() * (CONFIG.maxDelay - CONFIG.minDelay + 1)) + CONFIG.minDelay;
}

/**
 * Returns a promise that resolves after the specified delay
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Converts champion imageKey to metasrc slug format
 * @param {string} imageKey - The champion"s image key from DDragon
 * @returns {string} Slug for metasrc URL
 */
function imageKeyToSlug(imageKey) {
  // Start with lowercase alphanumerics only
  const key = String(imageKey || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  // Special cases where metasrc slug differs from DDragon id
  if (key === "monkeyking") return "wukong";

  return key;
}

/**
 * Loads champion data from the main JSON file
 * @returns {Promise<Array<{imageKey: string, slug: string, name: string}>>}
 */
async function loadChampionSlugs() {
  const raw = await fs.readFile(CHAMPIONS_FILE, "utf8");
  const champions = JSON.parse(raw);
  return champions
    .map((c) => ({ imageKey: c.imageKey, slug: imageKeyToSlug(c.imageKey), name: c.name }))
    .filter((c) => !!c.slug);
}

/**
 * Scrapes champion build data with retry logic
 * @param {import("puppeteer").Browser} browser - Puppeteer browser instance
 * @param {string} championName - Champion slug for URL
 * @returns {Promise<Object>} Champion build data
 */
async function getChampionBuildData(browser, championName) {
  let attempts = 0;
  let lastError = null;
  
  while (attempts < CONFIG.maxRetries) {
    attempts++;
    const page = await browser.newPage();
    
    try {
      // Set random user agent
      const userAgent = getRandomUserAgent();
      await page.setUserAgent(userAgent);
      console.log(`Attempt ${attempts} for ${championName} with UA: ${userAgent.slice(0, 20)}...`);
      
      // Navigate to champion page with increased timeout
      await page.goto(`https://www.metasrc.com/lol/arena/build/${championName}`, {
        waitUntil: CONFIG.waitUntil,
        timeout: CONFIG.timeout
      });
      
      // Wait for content
      await page.waitForSelector("h1, h2, h3", { timeout: 15000 }).catch(() => {});
      
      // Extract champion data using the existing logic
      const data = await page.evaluate(() => {
        const getText = (el) => (el && el.textContent ? el.textContent.trim() : "");
        
        const h1 = document.querySelector("h1");
        let championName = getText(h1);
        if (!championName) {
          championName = (document.title || "")
            .replace(/\s*-\s*Augments.*$/i, "")
            .replace(/\s*-\s*LoL.*$/i, "")
            .trim();
        }
        
        // Tier
        let tier = "Unknown";
        const all = Array.from(document.querySelectorAll("body *"));
        const tierHost = all.find((el) => /\bTier:\s*/i.test(el.textContent || ""));
        if (tierHost) {
          const m = (tierHost.textContent || "").match(/Tier:\s*(S\+|S|A|B|C|D|F)/i);
          if (m) tier = m[1].toUpperCase();
        }
        
        // Win rate
        let winRate = "Unknown";
        const winRateHost = all.find((el) => /\bWin Rate:\s*[\d.]+%/i.test(el.textContent || ""));
        if (winRateHost) {
          const m = (winRateHost.textContent || "").match(/Win Rate:\s*([\d.]+%)/i);
          if (m) winRate = m[1];
        }
        
        function extractSectionEntries(headingPart) {
          const headings = Array.from(document.querySelectorAll("h2, h3, h4, .heading, .section-title"));
          const heading = headings.find((h) =>
            (h.textContent || "").toLowerCase().includes(headingPart.toLowerCase())
          );
          
          if (!heading) return [];
          
          let searchArea = heading.parentElement;
          if (!searchArea || !searchArea.querySelector("img, a")) {
            searchArea = document.createElement("div");
            let sibling = heading.nextElementSibling;
            let maxSiblings = 10;
            
            while (sibling && maxSiblings > 0) {
              searchArea.appendChild(sibling.cloneNode(true));
              sibling = sibling.nextElementSibling;
              maxSiblings--;
              
              if (sibling && /h[2-6]/i.test(sibling.tagName)) break;
            }
          }
          
          const entries = [];
          const candidates = Array.from(
            searchArea.querySelectorAll("a[href*=\"augment\"], a[href*=\"item\"], img[alt], [data-name], [data-augment], [data-item], .augment, .item")
          );
          
          for (const el of candidates) {
            const name =
              el.getAttribute("data-name") ||
              el.getAttribute("data-augment") ||
              el.getAttribute("data-item") ||
              el.getAttribute("title") ||
              (el.tagName === "IMG" ? el.getAttribute("alt") : getText(el)) ||
              "";
            
            const cleanName = name.replace(/\s*\(.+?\)$/, "").trim();
            if (!cleanName || cleanName.length < 2) continue;
            
            let itemTier = "Unknown";
            const block = el.closest("li, .row, .grid, .grid-item, .media, .card, div");
            const txt = (block ? block.textContent : el.textContent) || "";
            const tm = txt.match(/\b(S\+|S|A|B|C|D|F)\b/);
            if (tm) itemTier = tm[1].toUpperCase();
            
            entries.push({ name: cleanName, tier: itemTier });
          }
          
          const seen = new Set();
          const out = [];
          for (const e of entries) {
            if (seen.has(e.name)) continue;
            seen.add(e.name);
            out.push(e);
          }
          return out;
        }
        
        return {
          name: championName || "Unknown",
          tier,
          stats: {
            winRate,
          },
          augments: {
            prismatic: extractSectionEntries("Prismatic Augment"),
            gold: extractSectionEntries("Gold Augment"),
            silver: extractSectionEntries("Silver Augment"),
          },
          items: {
            core: extractSectionEntries("Core Items").length ? 
              extractSectionEntries("Core Items") : extractSectionEntries("Items by Round"),
            boots: extractSectionEntries("Boots"),
            situational: extractSectionEntries("Situational Items"),
            juices: extractSectionEntries("Juices")
          },
          lastUpdated: new Date().toISOString()
        };
      });
      
      await page.close();
      return data; // Successfully got data, return it
      
    } catch (err) {
      await page.close();
      lastError = err;
      console.error(`Attempt ${attempts}/${CONFIG.maxRetries} for ${championName} failed: ${err.message}`);
      
      if (attempts < CONFIG.maxRetries) {
        const waitTime = getRandomDelay();
        console.log(`Waiting ${waitTime}ms before retrying...`);
        await delay(waitTime);
      }
    }
  }
  
  // If we get here, all attempts failed
  throw new Error(`Failed to scrape ${championName} after ${CONFIG.maxRetries} attempts: ${lastError?.message || "Unknown error"}`);
}

/**
 * Main execution function
 */
async function main() {
  const DATA_DIR = path.join(__dirname, "../public/data");
  await fs.mkdir(DATA_DIR, { recursive: true });
  
  console.log(`Starting data generation with config:
  - Max retries: ${CONFIG.maxRetries}
  - Delay between requests: ${CONFIG.minDelay}-${CONFIG.maxDelay}ms
  - Page timeout: ${CONFIG.timeout}ms`);
  
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage", // Helps with memory issues in containers
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu"
    ]
  });
  
  try {
    console.log("Browser launched successfully. Starting data collection...");
    const allData = [];
    const errors = [];
    
    const champions = await loadChampionSlugs();
    console.log(`Loaded ${champions.length} champions from source data.`);
    
    for (const { slug, imageKey } of champions) {
      try {
        console.log(`Processing ${slug} (from imageKey: ${imageKey})...`);
        const data = await getChampionBuildData(browser, slug);
        
        // Save individual champion data
        await fs.writeFile(
          path.join(DATA_DIR, `${slug}.json`), 
          JSON.stringify(data, null, 2)
        );
        
        // Add to combined data
        allData.push({
          name: data.name,
          tier: data.tier,
          winRate: data.stats.winRate
        });
        
        // Random delay between requests
        const waitTime = getRandomDelay();
        console.log(`Successfully processed ${slug}. Waiting ${waitTime}ms before next champion...`);
        await delay(waitTime);
        
      } catch (err) {
        console.error(`Error processing ${slug}: ${err.message}`);
        errors.push({ champion: slug, error: err.message });
        
        // Still wait before continuing to next champion after an error
        await delay(CONFIG.minDelay);
      }
    }
    
    // Sort by tier
    allData.sort((a, b) => {
      const tierValues = {
        "S+": 7, "S": 6, "A": 5, "B": 4, "C": 3, "D": 2, "F": 1, "Unknown": 0
      };
      return (tierValues[b.tier] || 0) - (tierValues[a.tier] || 0);
    });
    
    // Create index file with minimal data for all champions
    await fs.writeFile(
      path.join(DATA_DIR, "champions.json"),
      JSON.stringify({
        champions: allData,
        lastUpdated: new Date().toISOString(),
        errors: errors.length > 0 ? errors : undefined
      }, null, 2)
    );
    
    console.log(`Generated data for ${allData.length} champions`);
    if (errors.length > 0) {
      console.log(`Failed to generate data for ${errors.length} champions`);
    }
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
