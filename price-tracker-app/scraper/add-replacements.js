/**
 * add-replacements.js
 * Thêm 9 sản phẩm thay thế với URLs đã verified hoạt động:
 * - 3 điện thoại → FPT Shop (200 OK)
 * - 6 chuột → GearVN (đã xác nhận trong category list)
 */
import 'dotenv/config';
import FirecrawlApp from '@mendable/firecrawl-js';

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const FIRECRAWL_API_URL = process.env.FIRECRAWL_API_URL;
const BACKEND_INGEST_URL = process.env.BACKEND_INGEST_URL || 'http://localhost:8080/api/tracker/offers/ingest';
const DELAY = 2500;

const app = new FirecrawlApp({ apiKey: FIRECRAWL_API_KEY, apiUrl: FIRECRAWL_API_URL });

// 9 sản phẩm thay thế — URLs đã verified 200 OK
const REPLACEMENTS = [
  // === 3 ĐIỆN THOẠI (FPT Shop — 200 OK verified) ===
  {
    name: "Samsung Galaxy M55 5G 128GB", brand: "Samsung", category: "Điện thoại",
    urls: {
      "FPT Shop": "https://fptshop.com.vn/dien-thoai/samsung-galaxy-m55",
    }
  },
  {
    name: "Oppo A60 256GB", brand: "Oppo", category: "Điện thoại",
    urls: {
      "FPT Shop": "https://fptshop.com.vn/dien-thoai/oppo-a60",
    }
  },
  {
    name: "Xiaomi Redmi Note 14 256GB", brand: "Xiaomi", category: "Điện thoại",
    urls: {
      "FPT Shop":   "https://fptshop.com.vn/dien-thoai/xiaomi-redmi-note-14",
      "CellphoneS": "https://cellphones.com.vn/xiaomi-redmi-note-14.html",
    }
  },

  // === 6 CHUỘT (GearVN — verified từ category page) ===
  {
    name: "Akko Nest Wireless Gaming", brand: "Akko", category: "Chuột",
    urls: {
      "GearVN": "https://gearvn.com/products/chuot-khong-day-akko-nest-black",
    }
  },
  {
    name: "Akko Dash V9 Max Wireless", brand: "Akko", category: "Chuột",
    urls: {
      "GearVN": "https://gearvn.com/products/chuot-khong-day-akko-dash-v9-max-black",
    }
  },
  {
    name: "Razer Viper V4 Pro Wireless", brand: "Razer", category: "Chuột",
    urls: {
      "GearVN": "https://gearvn.com/products/chuot-razer-khong-day-viper-v4-pro-den",
    }
  },
  {
    name: "Asus ROG Strix Impact III Wireless", brand: "Asus", category: "Chuột",
    urls: {
      "GearVN": "https://gearvn.com/products/chuot-asus-rog-strix-impact-iii-wireless",
    }
  },
  {
    name: "Razer Viper V3 Pro Wireless", brand: "Razer", category: "Chuột",
    urls: {
      "GearVN": "https://gearvn.com/products/chuot-razer-khong-day-viper-v3-pro-den",
    }
  },
  {
    name: "Logitech M331 Silent Plus Wireless", brand: "Logitech", category: "Chuột",
    urls: {
      "GearVN": "https://gearvn.com/products/chuot-khong-day-logitech-m331-silent",
    }
  },
];

// Flatten targets
const TARGETS = [];
for (const p of REPLACEMENTS) {
  for (const [merchant, url] of Object.entries(p.urls)) {
    TARGETS.push({ ...p, merchant, url });
  }
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function extractPrice(markdown) {
  const patterns = [
    /(?:giá bán|giá:|giá niêm yết|price)[:\s]*([0-9]{1,3}(?:[.,][0-9]{3})*)\s*(?:₫|đ|VND)/gi,
    /([0-9]{1,3}(?:[.,][0-9]{3})+)\s*(?:₫|đ)(?!\s*\/\s*(?:tháng|ngày|năm))/g,
  ];
  const candidates = [];
  for (const pat of patterns) {
    for (const m of markdown.matchAll(pat)) {
      const raw = m[1].replace(/[.,]/g, '');
      const price = parseInt(raw);
      if (price >= 150_000 && price <= 80_000_000 && price % 1000 === 0) candidates.push(price);
    }
  }
  if (!candidates.length) return null;
  const freq = {};
  for (const p of candidates) freq[p] = (freq[p] || 0) + 1;
  return parseInt(Object.entries(freq).sort((a, b) => b[1] - a[1] || parseInt(a[0]) - parseInt(b[0]))[0][0]);
}

let stats = { ok: 0, error: 0 };

async function scrapeOne(t, idx, total) {
  console.log(`\n[${idx}/${total}] ${t.merchant} — ${t.name}`);
  console.log(`  🔍 ${t.url}`);

  try {
    const result = await app.scrapeUrl(t.url, {
      formats: ['markdown'],
      onlyMainContent: true,
      waitFor: 3000,
    });

    const mdLen = result.markdown?.length || 0;
    console.log(`  📄 ${mdLen} chars`);

    if (!result.success || mdLen < 500) {
      console.warn(`  ⚠️ Trang không load (${mdLen} chars)`);
      stats.error++;
      return;
    }

    const price = extractPrice(result.markdown);

    // Show top price hints for debug
    const hints = result.markdown.match(/[0-9]{1,3}(?:[.,][0-9]{3})+\s*(?:₫|đ)/g)?.slice(0, 5);
    console.log(`  💡 Giá thấy: ${hints?.join(' | ') || 'Không có'}`);

    if (!price) {
      console.warn(`  ⚠️ Không parse được giá hợp lệ`);
      stats.error++;
      return;
    }

    console.log(`  💰 Giá: ${price.toLocaleString('vi-VN')}đ`);

    const payload = {
      merchantName: t.merchant,
      merchantProductName: t.name,
      targetProductName: t.name,
      originalUrl: t.url,
      brand: t.brand,
      category: t.category,
      currentPrice: price,
      inStock: true,
      isFallback: false,
    };

    const res = await fetch(BACKEND_INGEST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`  💾 Lưu: productId=${data.productId}, offerId=${data.offerId} ✅`);
      stats.ok++;
    } else {
      const text = await res.text();
      console.error(`  ❌ Backend (${res.status}): ${text.substring(0, 200)}`);
      stats.error++;
    }
  } catch (err) {
    console.error(`  ❌ ${err.message}`);
    stats.error++;
  }
}

async function main() {
  console.log(`\n🚀 Thêm ${TARGETS.length} sản phẩm thay thế...\n`);
  for (let i = 0; i < TARGETS.length; i++) {
    await scrapeOne(TARGETS[i], i + 1, TARGETS.length);
    if (i < TARGETS.length - 1) await delay(DELAY);
  }
  console.log(`\n╔══════════════════════╗`);
  console.log(`║  ✅ OK: ${stats.ok}  ❌ Lỗi: ${stats.error}  ║`);
  console.log(`╚══════════════════════╝\n`);
}

main().catch(console.error);
