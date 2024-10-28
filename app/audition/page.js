"use client";

import { useState, useEffect } from "react";

export default function Audition() {
  const [auditionList, setAuditionList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

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

  // Filtered audition list based on search term
  const filteredList = auditionList.filter((auditionee) =>
    auditionee.auditioneeNumber.includes(searchTerm)
  );

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
