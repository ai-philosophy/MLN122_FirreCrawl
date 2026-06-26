import { execSync } from 'child_process';


// We can import PRODUCTS from scraper.js
// Since scraper.js is ES module, let's just parse it or read it, or import it.
// Let's write a quick inline version of PRODUCTS to check, or dynamic import.
import fs from 'fs';

async function main() {
  // Read products list from scraper.js
  const content = fs.readFileSync('scraper.js', 'utf8');
  // Extract products array using a simple regex or just load it
  // Since we want to check all URLs, let's write a quick script that dynamically imports scraper.js
  // But wait, scraper.js runs runScraper() at the end. We don't want to run the whole scraper.
  // Let's copy PRODUCTS array definition or import it.
  // Actually, we can read scraper.js and extract the PRODUCTS array text, or just evaluate it.
  // Let's parse scraper.js to extract the products.
  
  // A simple way is to find the array in scraper.js and match it.
  // But to be simple, let's extract the urls from scraper.js using regex.
  const urls = [];
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/"(https?:\/\/[^"]+)"/);
    if (match) {
      urls.push(match[1]);
    } else {
      const match2 = line.match(/'(https?:\/\/[^']+)'/);
      if (match2) {
        urls.push(match2[1]);
      }
    }
  }

  const uniqueUrls = [...new Set(urls)].filter(u => u.startsWith('http'));
  console.log(`Found ${uniqueUrls.length} unique URLs to test.`);

  const results = [];
  for (let i = 0; i < uniqueUrls.length; i++) {
    const url = uniqueUrls[i];
    console.log(`[${i+1}/${uniqueUrls.length}] Checking ${url}...`);
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 5000
      });
      console.log(`  -> Status: ${res.status}`);
      results.push({ url, status: res.status });
    } catch (err) {
      console.log(`  -> Error: ${err.message}`);
      results.push({ url, status: 'ERROR', error: err.message });
    }
  }

  console.log('\n--- RESULTS SUMMARY ---');
  const fileContent = JSON.stringify(results, null, 2);
  fs.writeFileSync('url_check_results.json', fileContent);
  console.log('Saved results to url_check_results.json');
  
  const urls404 = results.filter(r => r.status === 404);
  console.log(`\nFound ${urls404.length} URLs that returned 404:`);
  for (const r of urls404) {
    console.log(`- ${r.url}`);
  }
}

main().catch(err => console.error(err));
