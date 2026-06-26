import 'dotenv/config';
import FirecrawlApp from '@mendable/firecrawl-js';

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || 'local-no-key-needed';
const FIRECRAWL_API_URL = process.env.FIRECRAWL_API_URL || 'http://localhost:3002';
const BACKEND_BASE_URL = 'http://localhost:8080/api/tracker';
const DELAY_BETWEEN_REQUESTS_MS = 3000;

const app = new FirecrawlApp({ apiKey: FIRECRAWL_API_KEY, apiUrl: FIRECRAWL_API_URL });

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkUrlStatus(url) {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(4000)
    });
    return res.status;
  } catch (err) {
    return 'ERROR';
  }
}

async function deleteOfferFromBackend(merchantName, targetProductName) {
  try {
    const deleteUrl = `${BACKEND_BASE_URL}/offers?merchantName=${encodeURIComponent(merchantName)}&targetProductName=${encodeURIComponent(targetProductName)}`;
    const res = await fetch(deleteUrl, {
      method: 'DELETE'
    });
    if (res.ok) {
      console.log(`  🗑️  Đã xóa thành công offer lỗi của ${merchantName} cho ${targetProductName}`);
    } else {
      const text = await res.text();
      console.error(`  ❌ Lỗi xóa offer từ backend (${res.status}): ${text}`);
    }
  } catch (err) {
    console.error(`  ❌ Không kết nối được backend để xóa offer: ${err.message}`);
  }
}

async function scrapeProduct(url) {
  // Pre-check HTTP status
  const status = await checkUrlStatus(url);
  if (status === 404) {
    console.warn(`  ❌ Link trả về 404 khi check trước (HEAD/GET)`);
    return 'PRODUCT_NOT_FOUND_404';
  }

  try {
    console.log(`  🔍 Scraping (markdown): ${url}`);
    const result = await app.scrapeUrl(url, {
      formats: ['markdown']
    });

    const statusCode = result.statusCode || result.data?.statusCode;
    if (statusCode === 404) {
      console.warn(`  ❌ Link trả về 404 từ Firecrawl API`);
      return 'PRODUCT_NOT_FOUND_404';
    }

    if (result.success) {
      return result.markdown || result.data?.markdown || '';
    }
    throw new Error('Thất bại khi cào dữ liệu dạng markdown');
  } catch (err) {
    console.error(`  ❌ Lỗi scrape: ${err.message}`);
    return null;
  }
}

async function sendToBackend(payload) {
  try {
    const rawIngestUrl = `${BACKEND_BASE_URL}/offers/ingest-raw`;
    const res = await fetch(rawIngestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`  ✅ Đã cập nhật thành công: productId=${data.productId}, offerId=${data.offerId}`);
      return { success: true };
    } else {
      const text = await res.text();
      if (text.includes('PRODUCT_NOT_FOUND_404')) {
        console.warn(`  🗑️  Backend đã phát hiện 404 trong markdown và dọn dẹp`);
        return { success: false, is404: true };
      }
      console.error(`  ❌ Backend từ chối (${res.status}): ${text}`);
      return { success: false };
    }
  } catch (err) {
    console.error(`  ❌ Không kết nối được backend: ${err.message}`);
    return { success: false };
  }
}

async function main() {
  console.log('🚀 Bắt đầu quét các sản phẩm đang hiển thị Ước Lượng (fallback) để cào lại...');
  
  try {
    // 1. Lấy danh sách tất cả sản phẩm
    const productsRes = await fetch(`${BACKEND_BASE_URL}/products/search?query=`);
    if (!productsRes.ok) {
      throw new Error(`Không thể kết nối backend: ${productsRes.status}`);
    }
    
    const products = await productsRes.json();
    console.log(`📋 Tìm thấy ${products.length} sản phẩm trong cơ sở dữ liệu.`);
    
    // 2. Tìm tất cả các offer bị fallback
    const fallbackOffers = [];
    
    for (const p of products) {
      const detailRes = await fetch(`${BACKEND_BASE_URL}/products/${p.id}`);
      if (!detailRes.ok) continue;
      
      const details = await detailRes.json();
      const offers = details.offers || [];
      
      for (const o of offers) {
        if (o.isFallback) {
          fallbackOffers.push({
            productId: p.id,
            productName: p.name,
            brand: p.brand,
            category: p.category,
            merchantName: o.merchantName,
            url: o.url
          });
        }
      }
    }
    
    console.log(`⚠️ Phát hiện ${fallbackOffers.length} liên kết đang sử dụng giá Ước Lượng.`);
    
    if (fallbackOffers.length === 0) {
      console.log('🎉 Không có sản phẩm nào bị ước lượng! Tiến trình kết thúc.');
      return;
    }
    
    // 3. Tiến hành cào lại các offer này
    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;
    
    for (let i = 0; i < fallbackOffers.length; i++) {
      const target = fallbackOffers[i];
      console.log(`\n[${i + 1}/${fallbackOffers.length}] ${target.merchantName} — ${target.productName}`);
      
      const markdown = await scrapeProduct(target.url);
      
      if (markdown === 'PRODUCT_NOT_FOUND_404') {
        console.log(`  🗑️  Yêu cầu backend xóa offer lỗi (404)`);
        await deleteOfferFromBackend(target.merchantName, target.productName);
        skipCount++;
      } else {
        const payload = {
          merchantName: target.merchantName,
          originalUrl: target.url,
          rawMarkdown: markdown || 'FAILED_TO_CRAWL_CLOUDFLARE_OR_TIMEOUT',
          brand: target.brand,
          category: target.category,
          targetProductName: target.productName
        };
        
        console.log(`  📦 Đang gửi payload cào lại đến backend...`);
        const result = await sendToBackend(payload);
        if (result.success) {
          successCount++;
        } else {
          if (result.is404) {
            skipCount++;
          } else {
            failCount++;
          }
        }
      }
      
      if (i < fallbackOffers.length - 1) {
        console.log(`  ⏳ Chờ ${DELAY_BETWEEN_REQUESTS_MS / 1000}s...`);
        await delay(DELAY_BETWEEN_REQUESTS_MS);
      }
    }
    
    console.log('\n╔══════════════════════════════════════════╗');
    console.log(`║  Hoàn thành! ✅ ${successCount} thành công  🗑️ ${skipCount} dọn dẹp  ❌ ${failCount} thất bại  ║`);
    console.log('╚══════════════════════════════════════════╝');
    
  } catch (error) {
    console.error('❌ Lỗi tiến trình:', error.message);
  }
}

main();
