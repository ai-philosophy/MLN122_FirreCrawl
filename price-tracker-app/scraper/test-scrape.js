import 'dotenv/config';
import FirecrawlApp from '@mendable/firecrawl-js';
import fs from 'fs';

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const FIRECRAWL_API_URL = process.env.FIRECRAWL_API_URL;

const app = new FirecrawlApp({ apiKey: FIRECRAWL_API_KEY, apiUrl: FIRECRAWL_API_URL });

async function main() {
  const url = 'https://www.phucanh.vn/apple-iphone-16-pro-max-256gb.html';
  console.log(`Scraping: ${url}`);
  const result = await app.scrapeUrl(url, { formats: ['markdown'] });
  if (result.success) {
    const md = result.markdown || result.data?.markdown || '';
    fs.writeFileSync('phucanh_scraped_markdown.md', md);
    console.log(`Saved markdown, length: ${md.length}`);
  } else {
    console.error('Failed:', result.error);
  }
}

main();
