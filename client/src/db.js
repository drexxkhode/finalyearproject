import React, { useState, useEffect } from "react";
import TurfMap from "./components/TurfMap";
import DistrictSelector from "./components/DistrictSelector";
import "./App.css";

// Dummy data for two districts
const turfs = [
  { id: 1, name: "Pressec Turf", district: "District A", lat: 5.650, lng: -0.205 },
  { id: 2, name: "Legon Turf", district: "District A", lat: 5.652, lng: -0.210 },
  { id: 3, name: "East District Turf", district: "District B", lat: 5.670, lng: -0.220 },
  { id: 4, name: "West District Turf", district: "District B", lat: 5.680, lng: -0.225 },
];

function App() {
  const [selectedDistrict, setSelectedDistrict] = useState("District A");

  return (
    <div className="App">
      <h1>Astro Turf Booking System</h1>
      <DistrictSelector
        districts={["District A", "District B"]}
        selected={selectedDistrict}
        onSelect={setSelectedDistrict}
      />
      <TurfMap turfs={turfs} selectedDistrict={selectedDistrict} />
    </div>
  );
}

export default App;