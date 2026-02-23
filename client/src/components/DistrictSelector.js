import React from "react";

export default function DistrictSelector({ districts, selected, onSelect }) {
  return (
    <div style={{ margin: "10px" }}>
      {districts.map((d) => (
        <button
          key={d}
          onClick={() => onSelect(d)}
          style={{
            margin: "5px",
            padding: "8px 16px",
            backgroundColor: selected === d ? "green" : "gray",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          {d}
        </button>
      ))}
    </div>
  );
}