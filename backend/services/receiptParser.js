// backend/services/receiptParser.js
/**
 * Receipt text parser to extract merchant, date, total, and item rows.
 * OCR output varies a lot, so this keeps the rules conservative and visible.
 */
function parseReceiptText(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
  const result = {
    merchant: '',
    amount: null,
    date: '',
    category: '',
    currency: 'INR', // default
    items: [],
  };

  const parseMoney = (value) => Number.parseFloat(value.replace(/,/g, ''));
  const hasLetters = (value) => /[A-Za-z]/.test(value);
  const totalKeywords = /\b(TOTAL|GRAND TOTAL|NET TOTAL|AMOUNT PAYABLE|BALANCE DUE|SUBTOTAL|FOOD TAXABLE TOTAL)\b/i;
  const chargeKeywords = /\b(SERVICE CHARGE|SGST|CGST|GST|TAX|ROUND|DISCOUNT|CASH|PAYMENT|CREDIT CARD|DEBIT CARD)\b/i;
  const metaKeywords = /^(no|dt|tb|px|wt|op|kots?)\s*:/i;
  const sectionStart = /\b(DESCRIPTION|ITEM|PARTICULAR|QTY|AMOUNT)\b/i;
  const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})|(\d{1,2}[\/\-][A-Za-z]{3,9}[\/\-]\d{2,4})/;
  const itemRegex = /^>?\s*([A-Za-z0-9 ,.'()&/-]+?)\s+(\d+(?:[.,]\d+)?)\s+([0-9]+(?:,[0-9]{3})*[.,][0-9]{2})$/;
  const simpleItemRegex = /^>?\s*([A-Za-z0-9 ,.'()&/-]+?)\s+([0-9]+(?:,[0-9]{3})*[.,][0-9]{2})$/;
  const moneyOnlyRegex = /^([0-9]+(?:,[0-9]{3})*[.,][0-9]{2})$/;
  const numberOnlyRegex = /^([0-9]+(?:,[0-9]{3})*(?:[.,][0-9]{1,2})?)$/;
  const unitOnlyRegex = /^(pc|pcs|pkt|set|nos?|kg|g|ltr|ml)$/i;

  const monthMap = {
    jan: '01',
    feb: '02',
    mar: '03',
    apr: '04',
    may: '05',
    jun: '06',
    jul: '07',
    aug: '08',
    sep: '09',
    oct: '10',
    nov: '11',
    dec: '12',
  };

  const normalizeDate = (raw) => {
    const parts = raw.split(/[/\-]/);
    if (parts.length !== 3) return '';

    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }

    const month = monthMap[parts[1].slice(0, 3).toLowerCase()] || parts[1].padStart(2, '0');
    const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
    return `${year}-${month}-${parts[0].padStart(2, '0')}`;
  };

  const inferCategory = () => {
    const normalized = lines.join(' ').toLowerCase();
    if (/\b(food|restaurant|invoice|kot|menu|rice|kebab|fish|bread|kheer|biryani|roti|naan|murgh|dal|maas|alu|alur|kulfi|melon|cooler|puff|service charge)\b/.test(normalized)) {
      return 'Food';
    }
    return '';
  };

  const firstItemIndex = lines.findIndex(line => /^>/.test(line) || itemRegex.test(line) || simpleItemRegex.test(line));
  const merchantCandidates = firstItemIndex === -1 ? lines : lines.slice(0, firstItemIndex);
  const merchantLine = merchantCandidates.find(line =>
    hasLetters(line) &&
    !/^>/.test(line) &&
    !sectionStart.test(line) &&
    !totalKeywords.test(line) &&
    !chargeKeywords.test(line) &&
    !metaKeywords.test(line) &&
    !/\d+\s+[0-9,.]+$/.test(line)
  );
  if (merchantLine) result.merchant = merchantLine;

  result.category = inferCategory();

  let inItemSection = false;
  let pendingItemName = '';
  const columnNames = [];
  const columnAmounts = [];

  for (const line of lines) {
    if (sectionStart.test(line)) {
      inItemSection = true;
      continue;
    }

    if (!result.date) {
      const dMatch = line.match(dateRegex);
      if (dMatch) {
        result.date = normalizeDate(dMatch[0]);
      }
    }

    const totalMatch = line.match(totalKeywords);
    if (totalMatch) {
      const money = line.match(/([0-9]+(?:,[0-9]{3})*(?:[.,][0-9]{1,2})?)/g);
      if (money?.length) result.amount = parseMoney(money[money.length - 1]);
      inItemSection = false;
      continue;
    }

    if (chargeKeywords.test(line) || metaKeywords.test(line)) {
      continue;
    }

    const itemMatch = line.match(itemRegex) || line.match(simpleItemRegex);
    if (itemMatch) {
      const name = itemMatch[1].replace(/^>\s*/, '').trim();
      const amount = parseMoney(itemMatch[itemMatch.length - 1]);

      if (name && hasLetters(name) && Number.isFinite(amount)) {
        result.items.push({
          name,
          amount,
          category: result.category || '',
        });
      }
      pendingItemName = '';
      continue;
    }

    const money = line.match(moneyOnlyRegex);
    if (money) {
      columnAmounts.push(parseMoney(money[1]));
      continue;
    }

    if (/^\d+(?:[.,]\d+)?$/.test(line)) {
      continue;
    }

    if (!inItemSection && !/^>/.test(line)) {
      continue;
    }

    if (hasLetters(line) && !chargeKeywords.test(line) && !totalKeywords.test(line)) {
      const cleanedName = line.replace(/^>\s*/, '').replace(/\s+\d+$/, '').trim();
      if (cleanedName) {
        pendingItemName = cleanedName;
        columnNames.push(cleanedName);
      }
    }
  }

  const parseColumnarTable = () => {
    const textBlocks = [];
    const numberBlocks = [];
    let currentTextBlock = [];
    let currentNumberBlock = [];

    const flushText = () => {
      if (currentTextBlock.length) textBlocks.push(currentTextBlock);
      currentTextBlock = [];
    };

    const flushNumber = () => {
      if (currentNumberBlock.length) numberBlocks.push(currentNumberBlock);
      currentNumberBlock = [];
    };

    for (const line of lines) {
      if (totalKeywords.test(line) || chargeKeywords.test(line) || metaKeywords.test(line) || sectionStart.test(line)) {
        flushText();
        flushNumber();
        continue;
      }

      const numberMatch = line.match(numberOnlyRegex);
      if (numberMatch && !dateRegex.test(line)) {
        flushText();
        currentNumberBlock.push(parseMoney(numberMatch[1]));
        continue;
      }

      if (hasLetters(line) && !unitOnlyRegex.test(line)) {
        flushNumber();
        const cleanedName = line.replace(/^>\s*/, '').trim();
        if (cleanedName) currentTextBlock.push(cleanedName);
        continue;
      }

      flushText();
      flushNumber();
    }

    flushText();
    flushNumber();

    const nameBlock = textBlocks
      .filter(block => block.length >= 2)
      .sort((a, b) => b.length - a.length)[0] || [];

    if (!nameBlock.length) return [];

    const usableNumberBlocks = numberBlocks.filter(block => block.length >= Math.max(2, Math.floor(nameBlock.length * 0.5)));
    if (!usableNumberBlocks.length) return [];

    const amountBlock = result.amount
      ? usableNumberBlocks
          .map(block => ({ block, diff: Math.abs(block.reduce((sum, value) => sum + value, 0) - result.amount) }))
          .sort((a, b) => a.diff - b.diff)[0].block
      : usableNumberBlocks[usableNumberBlocks.length - 1];

    const count = Math.min(nameBlock.length, amountBlock.length);
    const amounts = amountBlock.length > nameBlock.length ? amountBlock.slice(amountBlock.length - count) : amountBlock.slice(0, count);

    return nameBlock.slice(0, count).map((name, index) => ({
      name,
      amount: amounts[index],
      category: inferCategoryForItem(name),
    }));
  };

  const inferCategoryForItem = (name) => {
    const normalized = name.toLowerCase();

    if (/\b(t-?shirt|topi)\b/.test(normalized)) return 'Clothing';
    if (/\b(pencil|paper|chart|register|colour|color|sketch|scissors|eraser|sharpener|scale|gum|batch|box|banner|certificate|id card|album)\b/.test(normalized)) return 'Education';
    if (/\b(gamla|watering|dustbin)\b/.test(normalized)) return 'Other';
    if (result.category) return result.category;
    return 'Other';
  };

  if (result.items.length === 0 && columnNames.length && columnAmounts.length) {
    const count = Math.min(columnNames.length, columnAmounts.length);
    const amounts = columnAmounts.slice(columnAmounts.length - count);
    result.items = columnNames.slice(0, count).map((name, index) => ({
      name,
      amount: amounts[index],
      category: inferCategoryForItem(name),
    }));
  }

  if (result.items.length === 0) {
    result.items = parseColumnarTable();
  }

  const positiveItems = result.items.filter(item => item.amount > 0);

  if (result.amount === null && positiveItems.length) {
    const total = positiveItems.reduce((sum, item) => sum + item.amount, 0);
    result.amount = Number(total.toFixed(2));
  }

  if (!result.merchant) {
    const fallbackMerchant = merchantCandidates.find(line => {
      const normalized = line.toLowerCase();
      return hasLetters(line) &&
        !sectionStart.test(line) &&
        !totalKeywords.test(line) &&
        !chargeKeywords.test(line) &&
        !normalized.includes('invoice');
    });

    if (fallbackMerchant) {
      result.merchant = fallbackMerchant;
    }
  }

  if (result.category) {
    result.items = result.items.map(item => ({
      ...item,
      category: item.category || inferCategoryForItem(item.name),
    }));
  }

  return result;
}

module.exports = { parseReceiptText };
