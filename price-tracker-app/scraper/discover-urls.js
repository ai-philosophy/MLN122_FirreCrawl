/**
 * discover-urls.js
 * Dùng Firecrawl để crawl trang danh mục chuột của GearVN
 * và lấy URLs sản phẩm thật
 */
import 'dotenv/config';
import FirecrawlApp from '@mendable/firecrawl-js';

const app = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY,
  apiUrl: process.env.FIRECRAWL_API_URL,
});

const CATEGORY_PAGES = [
  { site: 'GearVN', url: 'https://gearvn.com/collections/chuot-may-tinh', brand_filter: ['razer', 'corsair', 'dareu', 'steelseries', 'glorious', 'logitech', 'asus'] },
];

async function main() {
  for (const cat of CATEGORY_PAGES) {
    console.log(`\n📄 Crawling category: ${cat.url}`);
    
    try {
      const result = await app.scrapeUrl(cat.url, {
        formats: ['links', 'markdown'],
        onlyMainContent: true,
        waitFor: 3000,
      });

      if (!result.success) {
        console.error('Failed:', result.error);
        continue;
      }

      // Filter links chỉ lấy sản phẩm chuột
      const links = (result.links || []).filter(link => {
        const lower = link.toLowerCase();
        return lower.includes('/products/chuot') && 
               cat.brand_filter.some(b => lower.includes(b));
      });

      console.log(`\n✅ Tìm thấy ${links.length} product URLs:\n`);
      links.forEach(l => console.log(' -', l));
      
    } catch(e) {
      console.error('Error:', e.message);
    }
  }
}

main();
