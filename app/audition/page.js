"use client";

import { useState, useEffect } from "react";

export default function Audition() {
  const [auditionList, setAuditionList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterTypes, setFilterTypes] = useState({
    Vocals: false,
    Instrument: false,
    Dance: false,
  });

  // Fetch data from the Google Sheet on page load
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/get-audition-list");
        const data = await response.json();
        setAuditionList(data.auditionList || []);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching audition data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Toggle filter type
  const toggleFilter = (type) => {
    setFilterTypes((prevTypes) => ({
      ...prevTypes,
      [type]: !prevTypes[type],
    }));
  };

  // Handle score update submission
  const handleScoreSubmit = async (auditioneeNumber, score) => {
    try {
      await fetch("/api/update-audition-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditioneeNumber, score }),
      });
      setAuditionList((prevList) =>
        prevList.map((auditionee) =>
          auditionee.auditioneeNumber === auditioneeNumber
            ? { ...auditionee, score }
            : auditionee
        )
      );
    } catch (error) {
      console.error("Error updating score:", error);
    }
  };

  // Filter auditionees based on search term and selected types
  const filteredList = auditionList.filter((auditionee) => {
    const matchesSearch = auditionee.auditioneeNumber.includes(searchTerm);
    const matchesType =
      Object.values(filterTypes).some(Boolean) === false ||
      filterTypes[auditionee.auditionType];
    return matchesSearch && matchesType;
  });

  return (
    <div style={{ textAlign: "center", margin: "20px" }}>
      <h1>Audition Scoring</h1>
      <input
        type="text"
        placeholder="Search by Auditionee Number"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ padding: "10px", fontSize: "16px", width: "300px", margin: "10px 0" }}
      />
      
      {/* Filter Buttons */}
      <div style={{ marginBottom: "20px" }}>
        {["Vocals", "Instrument", "Dance"].map((type) => (
          <button
            key={type}
            onClick={() => toggleFilter(type)}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              margin: "0 5px",
              backgroundColor: filterTypes[type] ? "#007BFF" : "#ddd",
              color: filterTypes[type] ? "#fff" : "#000",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading audition data...</p>
      ) : (
        <div>
          {filteredList.map((auditionee) => (
            <div key={auditionee.auditioneeNumber} style={{ borderBottom: "1px solid #ddd", padding: "15px" }}>
              <p><strong>Auditionee Number:</strong> {auditionee.auditioneeNumber}</p>
              <p><strong>Name:</strong> {auditionee.name}</p>
              <p><strong>Email:</strong> {auditionee.email}</p>
              <p><strong>Audition Type:</strong> {auditionee.auditionType}</p>
              <label>
                <strong>Score:</strong>
                <input
                  type="number"
                  value={auditionee.score || ""}
                  onChange={(e) => handleScoreSubmit(auditionee.auditioneeNumber, e.target.value)}
                  style={{ marginLeft: "10px", padding: "5px", fontSize: "16px", width: "80px" }}
                />
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
