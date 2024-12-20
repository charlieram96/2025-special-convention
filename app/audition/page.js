"use client";

import { useState, useEffect } from "react";
import styles from './Audition.module.css';

import profileBlank from '../../public/blank-profile.jpg';
import uploadIcon from '../../public/upload-icon.svg';
import logo from '../../public/fort-lauderdale-2025-logo.svg';
import saveIcon from '../../public/save-icon.svg';

// Import ToastContainer and toast
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import PasswordProtect from '../components/PasswordProtect';

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
        toast.success(`Data saved successfully for auditionee ${auditionee.auditioneeNumber}`);
      } else {
        toast.error(`Failed to save data for auditionee ${auditionee.auditioneeNumber}`);
      }
    } catch (error) {
      console.error("Error saving auditionee data:", error);
      toast.error(`An error occurred while saving data for auditionee ${auditionee.auditioneeNumber}.`);
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
        toast.success(`Image uploaded successfully for auditionee ${auditioneeNumber}`);
        // Update the auditionList state to reflect the new image URL
        setAuditionList(prevList =>
          prevList.map(auditionee =>
            auditionee.auditioneeNumber === auditioneeNumber
              ? { ...auditionee, imageLink: data.imageUrl }
              : auditionee
          )
        );
      } else {
        toast.error(`Failed to upload image for auditionee ${auditioneeNumber}`);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(`Failed to upload image for auditionee ${auditioneeNumber}`);
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
          auditionTypes: auditionee.auditionType
            ? auditionee.auditionType.split(',').map(type => type.trim())
            : [],
          congregation: auditionee.congregation || "",
          observations: auditionee.observations || "",
          auditionLink: auditionee.auditionLink || "",
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
        toast.error("Failed to fetch audition data.");
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
    // Parse the searchTerm into an array of trimmed search terms
    const searchTerms = searchTerm
      .split(',')
      .map(term => term.trim())
      .filter(term => term !== '');
  
    // Check if auditioneeNumber matches any of the search terms
    const matchesSearch =
      searchTerms.length === 0 || // If no search term, match all
      searchTerms.some(term => auditionee.auditioneeNumber.includes(term));
  
    const matchesType =
      Object.values(filterTypes).some(Boolean) === false ||
      auditionee.auditionTypes.some(type => filterTypes[type]);
  
    return matchesSearch && matchesType;
  });

  return (
    <PasswordProtect>
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
              <button className={styles.save_button} onClick={() => handleSave(auditionee)}>
                <img src={saveIcon.src} alt="save icon" />
                Save
              </button>

              <div className={styles.profile_image_wrap}>
                {auditionee.imageLink ? (
                  <img
                    src={auditionee.imageLink}
                    alt={`${auditionee.name}'s image`}
                    style={{ width: "200px", height: "200px", objectFit: "cover" }}
                  />
                ) : (
                  <img
                    src={profileBlank.src}
                    alt={`placeholder image`}
                    style={{ width: "200px", height: "200px" }}
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
                <span className={styles.input_mimic}>{auditionee.auditionTypes.join(', ')}</span>
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
                <div className={styles.audition_link}>
                  Audition Link:{" "}
                  <input
                    type="text"
                    value={auditionee.auditionLink || ""}
                    onChange={(e) =>
                      handleInputChange(e, auditionee.auditioneeNumber, "auditionLink")
                    }
                  />
                </div>
              </div>

              {/* Vocals Section */}
              <div
                className={`${styles.auditionee_vocals_col} ${
                  !auditionee.auditionTypes.includes("Vocals") ? styles.reducedOpacity : ""
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
                    disabled={!auditionee.auditionTypes.includes("Vocals")}
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
                    disabled={!auditionee.auditionTypes.includes("Vocals")}
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
                    disabled={!auditionee.auditionTypes.includes("Vocals")}
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
                    disabled={!auditionee.auditionTypes.includes("Vocals")}
                  />
                </div>
              </div>

              {/* Instrument Section */}
              <div
                className={`${styles.auditionee_instrument_col} ${
                  !auditionee.auditionTypes.includes("Instrument") ? styles.reducedOpacity : ""
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
                    disabled={!auditionee.auditionTypes.includes("Instrument")}
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
                    disabled={!auditionee.auditionTypes.includes("Instrument")}
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
                    disabled={!auditionee.auditionTypes.includes("Instrument")}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Include the ToastContainer */}
      <ToastContainer />
    </div>
    </PasswordProtect>
  );
}
