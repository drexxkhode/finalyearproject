// routes/turf/turfImageRoute.js
const express = require('express');
const router  = express.Router({ mergeParams: true }); // mergeParams to access :id from parent
const adminAuth = require('../../middleware/auth'); // your existing admin middleware
const { upload } = require('../../middleware/upload');
const {
  getTurfImages,
  uploadTurfImages,
  setTurfCover,
  deleteTurfImage,
} = require('../../controllers/turfImageController');

// GET /api/turf/:id/images — public, anyone can view
router.get('/',                        getTurfImages);

// POST /api/turf/:id/images — admin only, upload up to 10 images at once
router.post('/', adminAuth, upload.array('images', 10), uploadTurfImages);

// PUT /api/turf/:id/images/:imageId/cover — admin only, set cover image
router.put('/:imageId/cover', adminAuth, setTurfCover);

// DELETE /api/turf/:id/images/:imageId — admin only, delete one image
router.delete('/:imageId', adminAuth, deleteTurfImage);

module.exports = router;