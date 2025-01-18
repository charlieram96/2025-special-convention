"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./Audition.module.css";

import profileBlank from "../../public/blank-profile.jpg";
import uploadIcon from "../../public/upload-icon.svg";
import logo from "../../public/fort-lauderdale-2025-logo.svg";
import saveIcon from "../../public/save-icon.svg";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import PasswordProtect from "../components/PasswordProtect";

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
        toast.success(
          `Data saved successfully for auditionee ${auditionee.auditioneeNumber}`
        );
      } else {
        toast.error(
          `Failed to save data for auditionee ${auditionee.auditioneeNumber}`
        );
      }
    } catch (error) {
      console.error("Error saving auditionee data:", error);
      toast.error(
        `An error occurred while saving data for auditionee ${auditionee.auditioneeNumber}.`
      );
    }
  };

  // Handle input changes for auditionee fields
  const handleInputChange = (e, auditioneeNumber, field) => {
    const value = e.target.value;
    setAuditionList((prevList) =>
      prevList.map((aud) =>
        aud.auditioneeNumber === auditioneeNumber
          ? { ...aud, [field]: value }
          : aud
      )
    );
  };

  const handleImageUpload = async (e, auditioneeNumber) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingId(auditioneeNumber);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("auditioneeId", auditioneeNumber);

    try {
      const response = await fetch("/api/upload-profile-image", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        toast.success(`Image uploaded successfully for auditionee ${auditioneeNumber}`);
        // Update the auditionList state to reflect the new image URL
        setAuditionList((prevList) =>
          prevList.map((aud) =>
            aud.auditioneeNumber === auditioneeNumber
              ? { ...aud, imageLink: data.imageUrl }
              : aud
          )
        );
      } else {
        toast.error(`Failed to upload image for auditionee ${auditioneeNumber}`);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
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
        const initializedData = (data.auditionList || []).map((aud) => ({
          ...aud,
          auditionTypes: aud.auditionType
            ? aud.auditionType.split(",").map((type) => type.trim())
            : [],
          congregation: aud.congregation || "",
          observations: aud.observations || "",
          auditionLink: aud.auditionLink || "",
          pitch: aud.pitch || "",
          rhythm: aud.rhythm || "",
          rangeOfVoice: aud.rangeOfVoice || "",
          harmony: aud.harmony || "",
          instrument: aud.instrument || "",
          reading: aud.reading || "",
          level: aud.level || "",
          // Judge score fields
          judge1Score: aud.judge1Score || "",
          judge2Score: aud.judge2Score || "",
          judge3Score: aud.judge3Score || "",
          // Add a "danceLevel" field if not present
          danceLevel: aud.danceLevel || "",
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

  // Helper: Convert "Smith, John" -> "John Smith"
  const getReversedName = (fullName) => {
    const parts = fullName.split(",").map((p) => p.trim());
    if (parts.length === 2) {
      return `${parts[1]} ${parts[0]}`.trim();
    }
    return fullName;
  };

  // Filter auditionees based on search term and selected types
  const filteredList = auditionList.filter((auditionee) => {
    // Parse the searchTerm into an array of trimmed search terms
    const searchTerms = searchTerm
      .split(",")
      .map((term) => term.trim().toLowerCase())
      .filter((term) => term !== "");

    const auditioneeNumberLC = auditionee.auditioneeNumber.toLowerCase();
    const auditioneeNameLC = auditionee.name.toLowerCase();
    const reversedNameLC = getReversedName(auditionee.name).toLowerCase();

    const matchesSearch =
      searchTerms.length === 0 ||
      searchTerms.some((term) => {
        return (
          auditioneeNumberLC.includes(term) ||
          auditioneeNameLC.includes(term) ||
          reversedNameLC.includes(term)
        );
      });

    const matchesType =
      Object.values(filterTypes).some(Boolean) === false ||
      auditionee.auditionTypes.some((type) => filterTypes[type]);

    return matchesSearch && matchesType;
  });

  return (
    // <PasswordProtect>
      <div style={{ textAlign: "center" }} className={styles.audition_wrap}>
        <img src={logo.src} className={styles.main_logo} alt="logo" />

        {/* Navigation Buttons */}
        {/* <nav className={styles.nav} style={{ marginBottom: "20px" }}>
          <Link href="../">
            <button className={styles.nav_button}>Home</button>
          </Link>
          <Link href="../results">
            <button className={styles.nav_button}>Results</button>
          </Link>
        </nav> */}

        <h1>Audition Scoring</h1>
        <input
          type="text"
          placeholder="Search by number or name"
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
            {searchTerm === "" ? (
                <p>Please enter a name or number above to see results.</p>
              ) : 
              (filteredList.map((auditionee, index) => (
              <div
                key={`${auditionee.auditioneeNumber}-${index}`}
                className={styles.auditionee}
              >
                <button
                  className={styles.save_button}
                  onClick={() => handleSave(auditionee)}
                >
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
                      alt="placeholder image"
                      style={{ width: "200px", height: "200px" }}
                    />
                  )}
                  <label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleImageUpload(e, auditionee.auditioneeNumber)
                      }
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
                        // <img src="/public/upload-icon.svg" alt="upload icon" />
                        `Upload image`
                      )}
                    </button>
                  </label>
                </div>

                <div className={styles.audition_type}>
                  Auditioning for:{" "}
                  <span className={styles.input_mimic}>
                    {auditionee.auditionTypes.join(", ")}
                  </span>
                </div>

                <div className={styles.auditionee_main_col}>
                  <div className={styles.row}>
                    <div className={styles.auditionee_number}>
                      Number:{" "}
                      {/* Make the auditioneeNumber readOnly so it's non-editable */}
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
                        onChange={(e) =>
                          handleInputChange(e, auditionee.auditioneeNumber, "name")
                        }
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

                  {/* Dance Level Dropdown (disabled unless "Dance" is in auditionTypes) */}
                  <div
                    className={styles.dance_level_wrapper}
                    style={{
                      opacity: auditionee.auditionTypes.includes("Dance") ? 1 : 0.3,
                      pointerEvents: auditionee.auditionTypes.includes("Dance")
                        ? "auto"
                        : "none",
                    }}
                  >
                    <label>Dance level:</label>
                    <select
                      className={styles.dropdown}
                      value={auditionee.danceLevel || ""}
                      onChange={(e) =>
                        handleInputChange(e, auditionee.auditioneeNumber, "danceLevel")
                      }
                    >
                      <option value="">Select Dance Level</option>
                      <option value="4: Expert">4: Expert</option>
                      <option value="3: Good">3: Good</option>
                      <option value="2: Acceptable">2: Acceptable</option>
                      <option value="1: Deficient">1: Deficient</option>
                    </select>
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

                  {/* Judge Score Inputs */}
                  <div className={styles.judge_scores}>
                    <div>Judge 1 Score:</div>
                    <input
                      type="text"
                      value={auditionee.judge1Score || ""}
                      onChange={(e) =>
                        handleInputChange(e, auditionee.auditioneeNumber, "judge1Score")
                      }
                    />
                  </div>
                  <div className={styles.judge_scores}>
                    <div>Judge 2 Score:</div>
                    <input
                      type="text"
                      value={auditionee.judge2Score || ""}
                      onChange={(e) =>
                        handleInputChange(e, auditionee.auditioneeNumber, "judge2Score")
                      }
                    />
                  </div>
                  <div className={styles.judge_scores}>
                    <div>Judge 3 Score:</div>
                    <input
                      type="text"
                      value={auditionee.judge3Score || ""}
                      onChange={(e) =>
                        handleInputChange(e, auditionee.auditioneeNumber, "judge3Score")
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
                  {/* Pitch Dropdown */}
                  <div>
                    <div className={styles.category}>Pitch:</div>
                    <select
                      className={styles.dropdown}
                      value={auditionee.pitch || ""}
                      onChange={(e) =>
                        handleInputChange(e, auditionee.auditioneeNumber, "pitch")
                      }
                      disabled={!auditionee.auditionTypes.includes("Vocals")}
                    >
                      <option value="">Select Pitch Level</option>
                      <option value="4: Expert">4: Expert</option>
                      <option value="3: Good">3: Good</option>
                      <option value="2: Acceptable">2: Acceptable</option>
                      <option value="1: Deficient">1: Deficient</option>
                    </select>
                  </div>
                  {/* Rhythm Dropdown */}
                  <div>
                    <div className={styles.category}>Rhythm:</div>
                    <select
                      className={styles.dropdown}
                      value={auditionee.rhythm || ""}
                      onChange={(e) =>
                        handleInputChange(e, auditionee.auditioneeNumber, "rhythm")
                      }
                      disabled={!auditionee.auditionTypes.includes("Vocals")}
                    >
                      <option value="">Select Rhythm Level</option>
                      <option value="4: Expert">4: Expert</option>
                      <option value="3: Good">3: Good</option>
                      <option value="2: Acceptable">2: Acceptable</option>
                      <option value="1: Deficient">1: Deficient</option>
                    </select>
                  </div>
                  {/* ROV Dropdown */}
                  <div className={styles.rov}>
                    <div className={styles.category}>ROV:</div>
                    <select
                      className={styles.dropdown}
                      value={auditionee.rangeOfVoice || ""}
                      onChange={(e) =>
                        handleInputChange(e, auditionee.auditioneeNumber, "rangeOfVoice")
                      }
                      disabled={!auditionee.auditionTypes.includes("Vocals")}
                    >
                      <option value="">Select Range</option>
                      <option value="Soprano">Soprano</option>
                      <option value="Alto">Alto</option>
                      <option value="Tenor">Tenor</option>
                      <option value="Bass">Bass</option>
                    </select>
                    <div className={styles.rov_low}>(Range of voice)</div>
                  </div>
                  {/* Harmony Dropdown */}
                  <div>
                    <div className={styles.category}>Harmony:</div>
                    <select
                      className={styles.dropdown}
                      value={auditionee.harmony || ""}
                      onChange={(e) =>
                        handleInputChange(e, auditionee.auditioneeNumber, "harmony")
                      }
                      disabled={!auditionee.auditionTypes.includes("Vocals")}
                    >
                      <option value="">Select Harmony Level</option>
                      <option value="4: Expert">4: Expert</option>
                      <option value="3: Good">3: Good</option>
                      <option value="2: Acceptable">2: Acceptable</option>
                      <option value="1: Deficient">1: Deficient</option>
                    </select>
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
                    {/* Reading Dropdown: Yes / No */}
                    <select
                      className={styles.yes_dropdown}
                      value={auditionee.reading || ""}
                      onChange={(e) =>
                        handleInputChange(e, auditionee.auditioneeNumber, "reading")
                      }
                      disabled={!auditionee.auditionTypes.includes("Instrument")}
                    >
                      <option value="">Select Reading</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <div className={styles.instrument_category}>Level:</div>
                    <select
                      className={styles.level_dropdown}
                      value={auditionee.level || ""}
                      onChange={(e) =>
                        handleInputChange(e, auditionee.auditioneeNumber, "level")
                      }
                      disabled={!auditionee.auditionTypes.includes("Instrument")}
                    >
                      <option value="">Select level</option>
                      <option value="4: Expert">4: Expert</option>
                      <option value="3: Good">3: Good</option>
                      <option value="2: Acceptable">2: Acceptable</option>
                      <option value="1: Deficient">1: Deficient</option>
                    </select>
                  </div>
                </div>
              </div>
            )))}
          </div>
        )}
        <ToastContainer />
      </div>
    // </PasswordProtect>
  );
}
