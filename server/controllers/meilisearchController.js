
const turfIndex = require("../config/Meilisearch");

 exports.meilisearch = async (req, res) => {

  const query = req.query.q || "";
  const district = req.query.district;

  const options = {
    limit: 10
  };

  if (district) {
    options.filter = `district = "${district}"`;
  }

  const results = await turfIndex.search(query, options);

  res.json(results.hits);

};

