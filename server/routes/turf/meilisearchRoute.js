const express = require("express");
const {
  meilisearch
} = require("../../controllers/meilisearchController");
const router = express.Router();

router.get("/search", meilisearch);
module.exports = router;