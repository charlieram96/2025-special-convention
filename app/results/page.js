"use client";
import { useState, useEffect } from "react";

export default function Results() {
  const [auditionList, setAuditionList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buttonLoading, setButtonLoading] = useState({}); // Track loading state per auditionee

  // Fetch audition list data
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

  // Handle result update
  const handleResultUpdate = async (auditioneeNumber, result) => {
    // Set loading state for the specific auditionee
    setButtonLoading((prev) => ({ ...prev, [auditioneeNumber]: result }));

    try {
      await fetch("/api/update-audition-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditioneeNumber, result }),
      });

      // Update local state with the new result
      setAuditionList((prevList) =>
        prevList.map((auditionee) =>
          auditionee.auditioneeNumber === auditioneeNumber
            ? { ...auditionee, result }
            : auditionee
        )
      );
    } catch (error) {
      console.error("Error updating result:", error);
    } finally {
      // Clear loading state for the button
      setButtonLoading((prev) => ({ ...prev, [auditioneeNumber]: null }));
    }
  };

  return (
    <div style={{ textAlign: "center", margin: "20px" }}>
      <h1>Audition Results</h1>
      {loading ? (
        <p>Loading audition data...</p>
      ) : (
        <div>
          {auditionList.map((auditionee) => (
            <div key={auditionee.auditioneeNumber} style={{ borderBottom: "1px solid #ddd", padding: "15px" }}>
              <p><strong>Auditionee Number:</strong> {auditionee.auditioneeNumber}</p>
              <p><strong>Name:</strong> {auditionee.name}</p>
              <p><strong>Email:</strong> {auditionee.email}</p>
              <p><strong>Score:</strong> {auditionee.score}</p>
              <p><strong>Result:</strong> {auditionee.result || "No result set"}</p>
              <div>
                {["Accept", "Decline", "Backup"].map((option) => (
                  <button
                    key={option}
                    onClick={() => handleResultUpdate(auditionee.auditioneeNumber, option)}
                    style={{
                      padding: "10px 20px",
                      fontSize: "16px",
                      margin: "5px",
                      backgroundColor:
                        auditionee.result === option ? "#007BFF" : "#ddd",
                      color: auditionee.result === option ? "#fff" : "#000",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                      opacity: buttonLoading[auditionee.auditioneeNumber] === option ? 0.7 : 1,
                    }}
                    disabled={buttonLoading[auditionee.auditioneeNumber] === option} // Disable during loading
                  >
                    {buttonLoading[auditionee.auditioneeNumber] === option
                      ? "Loading..."
                      : option}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
