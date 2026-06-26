import fs from 'fs';

const results = JSON.parse(fs.readFileSync('url_check_results.json', 'utf8'));
const urls404 = results.filter(r => r.status === 404);

const groups = {};
for (const r of urls404) {
  let merchant = 'Unknown';
  if (r.url.includes('phucanh.vn')) merchant = 'PhuCanh';
  else if (r.url.includes('shopdunk.com')) merchant = 'ShopDunk';
  else if (r.url.includes('cellphones.com.vn')) merchant = 'CellphoneS';
  else if (r.url.includes('fptshop.com.vn')) merchant = 'FPT Shop';
  else if (r.url.includes('gearvn.com')) merchant = 'GearVN';
  else if (r.url.includes('tinhocngoisao.com')) merchant = 'Tin Học Ngôi Sao';
  else if (r.url.includes('phongvu.vn')) merchant = 'Phong Vũ';
  
  if (!groups[merchant]) groups[merchant] = [];
  groups[merchant].push(r.url);
}

for (const [merchant, list] of Object.entries(groups)) {
  console.log(`\n=== ${merchant} (${list.length} URLs 404) ===`);
  for (const url of list.slice(0, 10)) {
    console.log(`- ${url}`);
  }
  if (list.length > 10) {
    console.log(`... and ${list.length - 10} more`);
  }
}
