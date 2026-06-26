/**
 * Price Tracker Scraper - Node.js
 * 
 * Script này cào dữ liệu từ các trang TMĐT điện tử sử dụng Firecrawl API 
 * và gửi dữ liệu cào được về Spring Boot Backend để lưu trữ và so khớp.
 */

import fetch from 'node-fetch'; // Nếu dùng Node.js cũ, cần npm install node-fetch. Với Node 18+ đã có global fetch.

// Cấu hình môi trường
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || 'YOUR_FIRECRAWL_API_KEY';
const FIRECRAWL_API_URL = process.env.FIRECRAWL_API_URL || 'https://api.firecrawl.dev';
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:8080/api/offers/ingest';

// Danh sách các link sản phẩm cần cào (Ví dụ cào thử nghiệm iPhone 15 Pro Max 256GB từ các nguồn)
const TARGET_PRODUCTS = [
  {
    merchantName: 'CellphoneS',
    url: 'https://cellphones.com.vn/iphone-15-pro-max.html'
  },
  {
    merchantName: 'FPT Shop',
    url: 'https://fptshop.com.vn/dien-thoai/iphone-15-pro-max'
  },
  {
    merchantName: 'Phong Vũ',
    url: 'https://phongvu.vn/apple-iphone-15-pro-max-256gb--s230902263'
  },
  {
    merchantName: 'GearVN',
    url: 'https://gearvn.com/products/iphone-15-pro-max-256gb-chinh-hang-vna'
  }
];

// Schema trích xuất dữ liệu sản phẩm bằng AI
const PRODUCT_EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    productName: { type: "string", description: "Tên đầy đủ của sản phẩm trên trang (Ví dụ: iPhone 15 Pro Max 256GB)" },
    brand: { type: "string", description: "Hãng sản xuất (Ví dụ: Apple, Samsung...)" },
    currentPrice: { type: "number", description: "Giá bán hiện tại ở dạng số nguyên, bỏ hết ký tự đ hay dấu chấm (Ví dụ: 29490000)" },
    originalPrice: { type: "number", description: "Giá niêm yết khi chưa giảm giá. Nếu không có giảm giá, để bằng currentPrice" },
    imageUrl: { type: "string", description: "URL ảnh đại diện chính của sản phẩm" },
    inStock: { type: "boolean", description: "true nếu còn hàng để mua, false nếu hết hàng/ngừng kinh doanh" }
  },
  required: ["productName", "currentPrice"]
};

/**
 * Gọi Firecrawl để scrape và extract thông tin sản phẩm
 */
async function scrapeProduct(url) {
  const endpoint = `${FIRECRAWL_API_URL}/v1/scrape`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
  };

  const payload = {
    url: url,
    formats: ['json'],
    jsonOptions: {
      schema: PRODUCT_EXTRACTION_SCHEMA
    }
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Firecrawl API error (${res.status}): ${errorText}`);
    }

    const result = await res.json();
    if (result.success && result.data && result.data.json) {
      return result.data.json;
    } else {
      throw new Error('Không trích xuất được dữ liệu có cấu trúc JSON.');
    }
  } catch (error) {
    console.error(`❌ Lỗi khi scrape URL ${url}:`, error.message);
    return null;
  }
}

/**
 * Gửi dữ liệu cào được về Spring Boot Backend
 */
async function sendToBackend(offerData) {
  try {
    const res = await fetch(BACKEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(offerData)
    });

    if (res.ok) {
      console.log(`✅ Đã gửi dữ liệu của ${offerData.merchantProductName} (${offerData.merchantName}) về Backend.`);
    } else {
      console.error(`❌ Backend từ chối dữ liệu (${res.status}):`, await res.text());
    }
  } catch (error) {
    console.error(`❌ Không kết nối được Backend:`, error.message);
  }
}

/**
 * Hàm khởi chạy chính
 */
async function main() {
  console.log('🚀 Bắt đầu tiến trình cào dữ liệu thiết bị điện tử...');
  
  for (const item of TARGET_PRODUCTS) {
    console.log(`\n🔍 Đang xử lý: [${item.merchantName}] - ${item.url}`);
    
    // 1. Scrape qua Firecrawl
    const extractedData = await scrapeProduct(item.url);
    
    if (extractedData) {
      console.log('✨ Dữ liệu trích xuất từ AI:', JSON.stringify(extractedData, null, 2));
      
      // Chuẩn bị payload gửi về Backend Spring Boot
      const payload = {
        merchantName: item.merchantName,
        originalUrl: item.url,
        merchantProductName: extractedData.productName,
        currentPrice: extractedData.currentPrice,
        originalPrice: extractedData.originalPrice || extractedData.currentPrice,
        imageUrl: extractedData.imageUrl || '',
        inStock: extractedData.inStock !== undefined ? extractedData.inStock : true,
        brand: extractedData.brand || 'Khác'
      };
      
      // 2. Gửi về Spring Boot
      await sendToBackend(payload);
    }
    
    // Nghỉ 3 giây giữa các lần cào để tránh bị rate limit
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  console.log('\n🎉 Hoàn thành tiến trình cào dữ liệu.');
}

main();
