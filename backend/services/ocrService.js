const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { parseReceiptText } = require('./receiptParser');

// Use OCR.Space API (free tier) – requires OCR_API_KEY env var
const OCR_API_URL = 'https://api.ocr.space/parse/image';

/**
 * Sends the image file to OCR API and returns raw OCR text.
 * @param {string} filePath - absolute path to the uploaded file
 * @returns {Promise<string>} OCR extracted plain text
 */
async function extractText(filePath) {
  const apiKey = process.env.OCR_API_KEY;
  if (!apiKey) {
    throw new Error('OCR_API_KEY not set in environment');
  }

  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('language', 'eng');
  form.append('isOverlayRequired', 'false');

  const response = await axios.post(OCR_API_URL, form, {
    headers: {
      apikey: apiKey,
      ...form.getHeaders(),
    }
  });

  const data = response.data;
  if (data.IsErroredOnProcessing) {
    throw new Error(data.ErrorMessage?.[0] || 'OCR processing error');
  }

  const rawText = (data.ParsedResults || []).map(r => r.ParsedText).join('\n');
  return rawText;
}

/**
 * Main OCR service entry point.
 * Accepts a file path, runs OCR, parses the result into structured JSON.
 * @param {string} filePath
 * @returns {Promise<Object>} structured expense data
 */
async function scanReceipt(filePath) {
  const rawText = await extractText(filePath);
  const parsed = parseReceiptText(rawText);

  return {
    ...parsed,
    rawText,
  };
}

module.exports = { scanReceipt };
