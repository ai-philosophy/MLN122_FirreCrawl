import fs from 'fs';

const markdown = fs.readFileSync('phucanh_scraped_markdown.md', 'utf8');

function tryRegexExtraction(markdown) {
  const lowerMarkdown = markdown.toLowerCase();
  
  // Suffix matches: đ, Đ, ₫, d, D, vnd, VND, vnđ, VNĐ
  // Negative lookahead (?!\p{L}) is matched by ensuring the next character is not a letter.
  const suffixPattern = "(?:[đĐ₫dD]|vnd|VND|vnđ|VNĐ)(?![a-zA-ZàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ])";

  // 1. Try to find the price using keywords first
  const priceKeywords = ["Giá bán", "Giá khuyến mãi", "Giá:", "Giá hiện tại", "đang bán", "Mua ngay"];
  for (const kw of priceKeywords) {
    const regexStr = kw + "\\s*[:\\-]?\\s*(\\d{1,3}(?:[\\.,]\\d{3})+)\\s*(?:" + suffixPattern + ")?";
    const regex = new RegExp(regexStr, 'gi');
    let match;
    while ((match = regex.exec(markdown)) !== null) {
      const cleanPriceStr = match[1].replace(/[\.,]/g, '');
      const matchedPrice = parseInt(cleanPriceStr, 10);
      if (matchedPrice >= 50000) {
        console.log(`Matched with keyword "${kw}": ${match[0]} -> ${matchedPrice}`);
        return matchedPrice;
      }
    }
  }

  // 2. If no keyword match, find the first price pattern in the document
  const regexStr2 = "(\\d{1,3}(?:[\\.,]\\d{3})+)\\s*" + suffixPattern;
  const regex2 = new RegExp(regexStr2, 'gi');
  let match2;
  while ((match2 = regex2.exec(markdown)) !== null) {
    const cleanPriceStr = match2[1].replace(/[\.,]/g, '');
    const matchedPrice = parseInt(cleanPriceStr, 10);
    if (matchedPrice >= 50000) {
      console.log(`Matched with first price pattern: ${match2[0]} -> ${matchedPrice}`);
      return matchedPrice;
    }
  }

  return null;
}

const price = tryRegexExtraction(markdown);
console.log(`Final extracted price: ${price}`);
