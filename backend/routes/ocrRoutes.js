// backend/routes/ocrRoutes.js
const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { scanReceiptHandler } = require('../controllers/ocrController');

// Single file upload field named 'file'
router.post('/scan-receipt', requireAuth, upload.single('file'), scanReceiptHandler);

module.exports = router;
