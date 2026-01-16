const express = require('express');
const router = express.Router();
const documentController = require('../controller/documentController');
const { protect } = require('../middleware/authMiddleware');

// All document routes require authentication
router.get('/', protect, documentController.getSharedDocuments);
router.post('/', protect, documentController.createSharedDocument);
router.put('/:id/shares', protect, documentController.updateDocumentShares);
router.delete('/:id', protect, documentController.deleteDocument);

module.exports = router;
