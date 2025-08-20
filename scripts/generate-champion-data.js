/* eslint-disable */
const puppeteer = require('puppeteer');
const fs = require('fs/promises');
const path = require('path');

// Load champion list from src/data/champions.json and derive metasrc slugs from imageKey
const CHAMPIONS_FILE = path.resolve(process.cwd(), 'src/data/champions.json');

function imageKeyToSlug(imageKey) {
  // Start with lowercase alphanumerics only
  const key = String(imageKey || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  // Special cases where metasrc slug differs from DDragon id
  if (key === 'monkeyking') return 'wukong';

  return key;
}

async function loadChampionSlugs() {
  const raw = await fs.readFile(CHAMPIONS_FILE, 'utf8');
  const champions = JSON.parse(raw);
  return champions
    .map((c) => ({ imageKey: c.imageKey, slug: imageKeyToSlug(c.imageKey), name: c.name }))
    .filter((c) => !!c.slug);
}

async function getChampionBuildData(browser, championName) {
  const page = await browser.newPage();
  
  try {
    // Modern UA
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
    );
    
    // Navigate to champion page
    await page.goto(`https://www.metasrc.com/lol/arena/build/${championName}`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    await page.waitForSelector('h1, h2, h3', { timeout: 10000 }).catch(() => {});
    
    // Extract data using the same scraping logic as before
    const data = await page.evaluate(() => {
      const getText = (el) => (el && el.textContent ? el.textContent.trim() : '');
      
      const h1 = document.querySelector('h1');
      let championName = getText(h1);
      if (!championName) {
        championName = (document.title || '')
          .replace(/\s*-\s*Augments.*$/i, '')
          .replace(/\s*-\s*LoL.*$/i, '')
          .trim();
      }
      
      // Tier
      let tier = 'Unknown';
      const all = Array.from(document.querySelectorAll('body *'));
      const tierHost = all.find((el) => /\bTier:\s*/i.test(el.textContent || ''));
      if (tierHost) {
        const m = (tierHost.textContent || '').match(/Tier:\s*(S\+|S|A|B|C|D|F)/i);
        if (m) tier = m[1].toUpperCase();
      }
      
      // Win rate
      let winRate = 'Unknown';
      const winRateHost = all.find((el) => /\bWin Rate:\s*[\d.]+%/i.test(el.textContent || ''));
      if (winRateHost) {
        const m = (winRateHost.textContent || '').match(/Win Rate:\s*([\d.]+%)/i);
        if (m) winRate = m[1];
      }
      
      function extractSectionEntries(headingPart) {
        const headings = Array.from(document.querySelectorAll('h2, h3, h4, .heading, .section-title'));
        const heading = headings.find((h) =>
          (h.textContent || '').toLowerCase().includes(headingPart.toLowerCase())
        );
        
        if (!heading) return [];
        
        let searchArea = heading.parentElement;
        if (!searchArea || !searchArea.querySelector('img, a')) {
          searchArea = document.createElement('div');
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
          searchArea.querySelectorAll('a[href*="augment"], a[href*="item"], img[alt], [data-name], [data-augment], [data-item], .augment, .item')
        );
        
        for (const el of candidates) {
          const name =
            el.getAttribute('data-name') ||
            el.getAttribute('data-augment') ||
            el.getAttribute('data-item') ||
            el.getAttribute('title') ||
            (el.tagName === 'IMG' ? el.getAttribute('alt') : getText(el)) ||
            '';
          
          const cleanName = name.replace(/\s*\(.+?\)$/, '').trim();
          if (!cleanName || cleanName.length < 2) continue;
          
          let itemTier = 'Unknown';
          const block = el.closest('li, .row, .grid, .grid-item, .media, .card, div');
          const txt = (block ? block.textContent : el.textContent) || '';
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
        name: championName || 'Unknown',
        tier,
        stats: {
          winRate,
        },
        augments: {
          prismatic: extractSectionEntries('Prismatic Augment'),
          gold: extractSectionEntries('Gold Augment'),
          silver: extractSectionEntries('Silver Augment'),
        },
        items: {
          core: extractSectionEntries('Core Items').length ? 
            extractSectionEntries('Core Items') : extractSectionEntries('Items by Round'),
          boots: extractSectionEntries('Boots'),
          situational: extractSectionEntries('Situational Items'),
          juices: extractSectionEntries('Juices')
        },
        lastUpdated: new Date().toISOString()
      };
    });
    
    return data;
  } finally {
    await page.close();
  }
}

async function main() {
  const DATA_DIR = path.join(__dirname, '../public/data');
  await fs.mkdir(DATA_DIR, { recursive: true });
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    console.log('Starting data generation...');
    const allData = [];
    const errors = [];
    
  const champions = await loadChampionSlugs();
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
        
        // Small delay to avoid overwhelming the site
        await new Promise(r => setTimeout(r, 1000));
      } catch (err) {
        console.error(`Error processing ${slug}: ${err.message}`);
        errors.push({ champion: slug, error: err.message });
      }
    }
    
    // Sort by tier
    allData.sort((a, b) => {
      const tierValues = {
        'S+': 7, 'S': 6, 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'F': 1, 'Unknown': 0
      };
      return (tierValues[b.tier] || 0) - (tierValues[a.tier] || 0);
    });
    
    // Create index file with minimal data for all champions
    await fs.writeFile(
      path.join(DATA_DIR, 'champions.json'),
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