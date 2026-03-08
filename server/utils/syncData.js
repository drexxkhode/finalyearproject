const db = require('../config/db');
const turfIndex = require("../config/Meilisearch");

async function syncTurfs() {

  
  const [turfs] = await db.execute(`
    SELECT 
    id, 
    name,
      district, 
      latitude, 
      longitude, 
      location, 
      price_per_hour 
      FROM turfs
  `);

  await turfIndex.addDocuments(turfs);

  console.log("Turfs indexed in Meilisearch");

}

syncTurfs();