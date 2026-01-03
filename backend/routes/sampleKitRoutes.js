const express = require('express');
const path = require('path');
const router = express.Router();

// Force download for markdown files
router.get('/download/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '../../frontend/public/sample-templates', filename);
  res.download(filePath, filename, err => {
    if (err) {
      res.status(404).json({ error: 'File not found' });
    }
  });
});

module.exports = router;
