const fs = require('fs');
const { scanReceipt } = require('../services/ocrService');

/**
 * POST /api/ocr/scan-receipt
 * Handles receipt image/PDF uploads, runs OCR, and returns structured data.
 */
async function scanReceiptHandler(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: 'File is required' });
  }

  const filePath = req.file.path;
  try {
    const result = await scanReceipt(filePath);
    fs.unlink(filePath, (err) => {
      if (err) console.error('Failed to delete temp file:', err);
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    fs.unlink(filePath, () => {});
    console.error('OCR processing error:', error);
    return res.status(500).json({ success: false, message: error.message || 'OCR processing failed' });
  }
}

module.exports = { scanReceiptHandler };
