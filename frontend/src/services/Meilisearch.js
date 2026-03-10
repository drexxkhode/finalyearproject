import { useState } from "react";
const API = process.env.REACT_APP_URL || "http://localhost:5000";
function SearchBox() {

  const [results, setResults] = useState([]);

  const search = async (value) => {

    const res = await fetch(`${API}/api/turf/search?q=${value}`);

    const data = await res.json();

    setResults(data);

  };

  return (
    <div>

      <input
        type="text"
        className="form-control col-6"
        placeholder="Search products or locations"
        onChange={(e) => search(e.target.value)}
      />

      <ul>
        {results.map((item) => (
          <li key={item.id}>
            {item.name} - {item.location}
          </li>
        ))}
      </ul>

    </div>
  );
}

export default SearchBox;