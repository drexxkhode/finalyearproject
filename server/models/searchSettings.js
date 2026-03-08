const turfIndex = require("../config/Meilisearch");

async function setup() {

  await turfIndex.updateSearchableAttributes([
    "name",
    "latitude",
    "longitude",
    "district",
    "location"
  ]);

  await turfIndex.updateFilterableAttributes([
    "id",
    "district",
    "location"
  ]);

  await turfIndex.updateSortableAttributes([
    "price_per_hour"
  ]);

}

setup();