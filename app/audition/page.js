"use client";

import { useState, useEffect } from "react";
import styles from './Audition.module.css';

export default function Audition() {
  const [auditionList, setAuditionList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadingId, setUploadingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [filterTypes, setFilterTypes] = useState({
    Vocals: false,
    Instrument: false,
    Dance: false,
  });

  const handleImageUpload = async (e, auditioneeNumber) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingId(auditioneeNumber);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('auditioneeId', auditioneeNumber);

    try {
      const response = await fetch('/api/upload-profile-image', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        alert(`Image uploaded successfully for auditionee ${auditioneeNumber}`);
        // Optionally, update the auditionList state to reflect the new image URL
        setAuditionList(prevList =>
          prevList.map(auditionee =>
            auditionee.auditioneeNumber === auditioneeNumber
              ? { ...auditionee, imageLink: data.imageUrl }
              : auditionee
          )
        );
      } else {
        alert(`Failed to upload image for auditionee ${auditioneeNumber}`);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploadingId(null);
    }
  };


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
    <div style={{ textAlign: "center", margin: "20px" }} className={styles.audition_wrap}>
      <h1>Audition Scoring</h1>
      <input
        type="text"
        placeholder="Search by number"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className={styles.audition_search}
      />
      
      {/* Filter Buttons */}
      <div style={{ marginBottom: "20px" }} className={styles.filter_buttons}>
        {["Vocals", "Instrument", "Dance"].map((type) => (
          <button
            key={type}
            onClick={() => toggleFilter(type)}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              margin: "0 5px",
              backgroundColor: filterTypes[type] ? "#0088AD" : "#addbe3",
              color: filterTypes[type] ? "#fff" : "#fff",
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
            <div key={auditionee.auditioneeNumber} className={styles.auditionee}>
              {auditionee.imageLink && (
                <img src={auditionee.imageLink} alt={`${auditionee.name}'s image`} style={{ width: '150px', height: 'auto' }} />
              )}
              <div>
                <label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleImageUpload(e, auditionee.auditioneeNumber)}
                    style={{ display: 'none' }}
                  />
                  <button
                    onClick={e => e.target.previousSibling.click()}
                    disabled={uploadingId === auditionee.auditioneeNumber}
                  >
                    {uploadingId === auditionee.auditioneeNumber ? 'Uploading...' : 'Upload Image'}
                  </button>
                </label>
              </div>
            </div>
          ))}
              <p><strong>Auditionee Number:</strong> {auditionee.auditioneeNumber}</p>
              <p><strong>Name:</strong> {auditionee.name}</p>
              <p><strong>Email:</strong> {auditionee.email}</p>
              <p><strong>Audition Type:</strong> {auditionee.auditionType}</p>
              <label>
                <strong>Score:</strong>
                <input
                  type='text'
                  value={auditionee.score || ""}
                  onChange={(e) => handleScoreSubmit(auditionee.auditioneeNumber, e.target.value)}
                  className={styles.judge_input}
                />
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
