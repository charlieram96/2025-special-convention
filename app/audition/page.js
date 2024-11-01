"use client";

import { useState, useEffect } from "react";
import styles from './Audition.module.css';

import profileBlank from '../../public/blank-profile.jpg';
import uploadIcon from '../../public/upload-icon.svg';
import logo from '../../public/fort-lauderdale-2025-logo.svg';

export default function Audition() {
  const [auditionList, setAuditionList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadingId, setUploadingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterTypes, setFilterTypes] = useState({
    Vocals: false,
    Instrument: false,
    Dance: false,
  });

  const handleSave = async (auditionee) => {
    try {
      const response = await fetch("/api/update-auditionee", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(auditionee),
      });
      const data = await response.json();
      if (data.success) {
        alert(`Data saved successfully for auditionee ${auditionee.auditioneeNumber}`);
      } else {
        alert(`Failed to save data for auditionee ${auditionee.auditioneeNumber}`);
      }
    } catch (error) {
      console.error("Error saving auditionee data:", error);
    }
  };

  // Handle input changes for auditionee fields
  const handleInputChange = (e, auditioneeNumber, field) => {
    const value = e.target.value;
    setAuditionList((prevList) =>
      prevList.map((auditionee) =>
        auditionee.auditioneeNumber === auditioneeNumber
          ? { ...auditionee, [field]: value }
          : auditionee
      )
    );
  };

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
        // Update the auditionList state to reflect the new image URL
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
      alert(`Failed to upload image for auditionee ${auditioneeNumber}`);
    } finally {
      setUploadingId(null);
      e.target.value = null;
    }
  };

  // Fetch data from the Google Sheet on page load
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/get-audition-list");
        const data = await response.json();
        const initializedData = (data.auditionList || []).map(auditionee => ({
          ...auditionee,
          congregation: auditionee.congregation || "",
          observations: auditionee.observations || "",
          pitch: auditionee.pitch || "",
          rhythm: auditionee.rhythm || "",
          rangeOfVoice: auditionee.rangeOfVoice || "",
          harmony: auditionee.harmony || "",
          instrument: auditionee.instrument || "",
          reading: auditionee.reading || "",
          level: auditionee.level || "",
        }));
        setAuditionList(initializedData);
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

  // Filter auditionees based on search term and selected types
  const filteredList = auditionList.filter((auditionee) => {
    const matchesSearch = auditionee.auditioneeNumber.includes(searchTerm);
    const matchesType =
      Object.values(filterTypes).some(Boolean) === false ||
      filterTypes[auditionee.auditionType];
    return matchesSearch && matchesType;
  });

  return (
    <div style={{ textAlign: "center" }} className={styles.audition_wrap}>
      <img src={logo.src} className={styles.main_logo} alt="logo" />
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
              <button onClick={() => handleSave(auditionee)}>Save</button>

              <div className={styles.profile_image_wrap}>
                {auditionee.imageLink ? (
                  <img
                    src={auditionee.imageLink}
                    alt={`${auditionee.name}'s image`}
                    style={{ width: "200px", height: "auto" }}
                  />
                ) : (
                  <img
                    src={profileBlank.src}
                    alt={`placeholder image`}
                    style={{ width: "200px", height: "auto" }}
                  />
                )}
                <label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, auditionee.auditioneeNumber)}
                    style={{ display: "none" }}
                  />
                  <button
                    onClick={(e) => e.target.previousSibling.click()}
                    disabled={uploadingId === auditionee.auditioneeNumber}
                    className={styles.upload_button}
                  >
                    {uploadingId === auditionee.auditioneeNumber ? (
                      "Uploading..."
                    ) : (
                      <img src={uploadIcon.src} alt="upload icon" />
                    )}
                  </button>
                </label>
              </div>

              <div className={styles.audition_type}>
                Auditioning for:{" "}
                <span className={styles.input_mimic}>{auditionee.auditionType}</span>
              </div>

              <div className={styles.auditionee_main_col}>
                <div className={styles.row}>
                  <div className={styles.auditionee_number}>
                    Number:{" "}
                    <input
                      type="text"
                      value={auditionee.auditioneeNumber}
                      readOnly
                    />
                  </div>
                  <div className={styles.auditionee_name}>
                    Name:{" "}
                    <input
                      type="text"
                      value={auditionee.name}
                      onChange={(e) => handleInputChange(e, auditionee.auditioneeNumber, "name")}
                    />
                  </div>
                </div>
                <div className={styles.congregation}>
                  Congregation:{" "}
                  <input
                    type="text"
                    value={auditionee.congregation || ""}
                    onChange={(e) =>
                      handleInputChange(e, auditionee.auditioneeNumber, "congregation")
                    }
                  />
                </div>
                <div className={styles.observations}>
                  <div>Observations:</div>
                  <textarea
                    value={auditionee.observations || ""}
                    onChange={(e) =>
                      handleInputChange(e, auditionee.auditioneeNumber, "observations")
                    }
                  />
                </div>
              </div>

              {/* Vocals Section */}
              <div
                className={`${styles.auditionee_vocals_col} ${
                  auditionee.auditionType !== "Vocals" ? styles.reducedOpacity : ""
                }`}
              >
                <div className={styles.col_type}>Vocals</div>
                <div>
                  <div className={styles.category}>Pitch:</div>
                  <input
                    type="text"
                    value={auditionee.pitch || ""}
                    onChange={(e) =>
                      handleInputChange(e, auditionee.auditioneeNumber, "pitch")
                    }
                  />
                </div>
                <div>
                  <div className={styles.category}>Rhythm:</div>
                  <input
                    type="text"
                    value={auditionee.rhythm || ""}
                    onChange={(e) =>
                      handleInputChange(e, auditionee.auditioneeNumber, "rhythm")
                    }
                  />
                </div>
                <div className={styles.rov}>
                  <div className={styles.category}>ROV:</div>
                  <input
                    type="text"
                    value={auditionee.rangeOfVoice || ""}
                    onChange={(e) =>
                      handleInputChange(e, auditionee.auditioneeNumber, "rangeOfVoice")
                    }
                  />
                  <div className={styles.rov_low}>(Range of voice)</div>
                </div>
                <div>
                  <div className={styles.category}>Harmony:</div>
                  <input
                    type="text"
                    value={auditionee.harmony || ""}
                    onChange={(e) =>
                      handleInputChange(e, auditionee.auditioneeNumber, "harmony")
                    }
                  />
                </div>
              </div>

              {/* Instrument Section */}
              <div
                className={`${styles.auditionee_instrument_col} ${
                  auditionee.auditionType !== "Instrument" ? styles.reducedOpacity : ""
                }`}
              >
                <div className={styles.col_type}>Instrument</div>
                <div>
                  <div className={styles.instrument_category}>Instrument:</div>
                  <input
                    type="text"
                    className={styles.instrument_input}
                    value={auditionee.instrument || ""}
                    onChange={(e) =>
                      handleInputChange(e, auditionee.auditioneeNumber, "instrument")
                    }
                  />
                </div>
                <div>
                  <div className={styles.instrument_category}>Reading:</div>
                  <input
                    type="text"
                    value={auditionee.reading || ""}
                    onChange={(e) =>
                      handleInputChange(e, auditionee.auditioneeNumber, "reading")
                    }
                  />
                </div>
                <div>
                  <div className={styles.instrument_category}>Level:</div>
                  <input
                    type="text"
                    value={auditionee.level || ""}
                    onChange={(e) =>
                      handleInputChange(e, auditionee.auditioneeNumber, "level")
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
