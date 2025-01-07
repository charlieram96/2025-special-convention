"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./Results.module.css";
import logo from "../../public/fort-lauderdale-2025-logo.svg";
import profileBlank from "../../public/blank-profile.jpg";

import PasswordProtect from "../components/PasswordProtect";

export default function Results() {
  const [auditionList, setAuditionList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buttonLoading, setButtonLoading] = useState({}); // Track loading state per auditionee
  const [resultFilter, setResultFilter] = useState("All"); // Result filter state
  const [selectedAuditionType, setSelectedAuditionType] = useState(null); // Selected audition type

  // State variables for metrics
  const [metrics, setMetrics] = useState({
    total: 0,
    accepted: 0,
    declined: 0,
    backup: 0,
    pending: 0,
  });

  // Fetch audition list data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/get-audition-list");
        const data = await response.json();

        // Parse auditionType into an array of auditionTypes
        const initializedData = (data.auditionList || []).map((auditionee) => ({
          ...auditionee,
          auditionTypes: auditionee.auditionType
            ? auditionee.auditionType.split(",").map((type) => type.trim())
            : [],
          // If you store judge scores in your database/Google Sheet,
          // ensure they're included here. Example:
          judge1Score: auditionee.judge1Score || "",
          judge2Score: auditionee.judge2Score || "",
          judge3Score: auditionee.judge3Score || "",
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

  // Calculate metrics
  useEffect(() => {
    if (!loading && auditionList.length > 0 && selectedAuditionType) {
      const filteredAuditionees = auditionList.filter((auditionee) =>
        auditionee.auditionTypes.includes(selectedAuditionType)
      );

      const total = filteredAuditionees.length;
      const accepted = filteredAuditionees.filter((a) => a.result === "Accept").length;
      const declined = filteredAuditionees.filter((a) => a.result === "Decline").length;
      const backup = filteredAuditionees.filter((a) => a.result === "Backup").length;
      const pending = total - accepted - declined - backup;

      setMetrics({
        total,
        accepted,
        declined,
        backup,
        pending,
      });
    }
  }, [auditionList, loading, selectedAuditionType]);

  // Filtering the audition list based on the selected filter options
  const filteredAuditionList = auditionList.filter((auditionee) => {
    if (!selectedAuditionType) return false; // If no type selected, skip
    // Check if auditionee has the selected audition type
    if (!auditionee.auditionTypes.includes(selectedAuditionType)) {
      return false;
    }

    // Apply result filter
    if (resultFilter === "All") return true;
    if (resultFilter === "Pending") {
      return !auditionee.result || auditionee.result === "";
    }
    return auditionee.result === resultFilter;
  });

  // If no audition type is selected, display selection options
  if (!selectedAuditionType) {
    return (
      // <PasswordProtect>
        <div style={{ textAlign: "center" }} className={styles.results_wrap}>
          <img src={logo.src} className={styles.main_logo} alt="logo" />
          {/* Navigation Buttons */}
          <nav className={styles.nav} style={{ marginBottom: "20px" }}>
            <Link href="../">
              <button className={styles.nav_button}>Home</button>
            </Link>
            <Link href="../audition">
              <button className={styles.nav_button}>Audition</button>
            </Link>
          </nav>

          <h1>Select Audition Type</h1>
          <div className={styles.selection_buttons}>
            {["Vocals", "Instrument", "Dance"].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedAuditionType(type)}
                className={styles.selection_button}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      // </PasswordProtect>
    );
  }

  return (
    // <PasswordProtect>
      <div style={{ textAlign: "center" }} className={styles.results_wrap}>
        <img src={logo.src} className={styles.main_logo} alt="logo" />

        {/* Navigation Buttons */}
        <nav className={styles.nav} style={{ marginBottom: "20px" }}>
          <Link href="../">
            <button className={styles.nav_button}>Home</button>
          </Link>
          <Link href="../audition">
            <button className={styles.nav_button}>Audition</button>
          </Link>
        </nav>

        <h1>{selectedAuditionType} Auditions</h1>

        {/* Metrics Section */}
        <div className={styles.metrics}>
          <div className={styles.metrics_item}>
            <span className={styles.metrics_label}>Total Auditionees:</span>
            <span className={styles.metrics_value}>{metrics.total}</span>
          </div>
          <div className={styles.metrics_item}>
            <span className={styles.metrics_label}>Accepted:</span>
            <span className={styles.metrics_value}>{metrics.accepted}</span>
          </div>
          <div className={styles.metrics_item}>
            <span className={styles.metrics_label}>Declined:</span>
            <span className={styles.metrics_value}>{metrics.declined}</span>
          </div>
          <div className={styles.metrics_item}>
            <span className={styles.metrics_label}>Backup:</span>
            <span className={styles.metrics_value}>{metrics.backup}</span>
          </div>
          <div className={styles.metrics_item}>
            <span className={styles.metrics_label}>Pending:</span>
            <span className={styles.metrics_value}>{metrics.pending}</span>
          </div>
        </div>

        <div className={styles.filter_title}>Filters</div>

        {/* Result Filter Buttons */}
        <div className={styles.result_filter_buttons}>
          {["All", "Accept", "Decline", "Backup", "Pending"].map((option) => (
            <button
              key={option}
              onClick={() => setResultFilter(option)}
              className={`${styles.filter_button} ${
                resultFilter === option ? styles.active_button : ""
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        {loading ? (
          <p>Loading audition data...</p>
        ) : (
          <div>
            {filteredAuditionList.map((auditionee) => (
              <div key={auditionee.auditioneeNumber} className={styles.auditionee}>
                {/* Profile Image */}
                <div className={styles.profile_image_wrap}>
                  {auditionee.imageLink ? (
                    <img
                      src={auditionee.imageLink}
                      alt={`${auditionee.name}'s image`}
                      className={styles.profile_image}
                    />
                  ) : (
                    <img
                      src={profileBlank.src}
                      alt="placeholder image"
                      className={styles.profile_image}
                    />
                  )}
                </div>

                {/* Auditionee Information */}
                <div className={styles.auditionee_info}>
                  <div className={styles.row}>
                    <div className={styles.auditionee_number}>
                      Number:{" "}
                      <span className={styles.input_mimic}>{auditionee.auditioneeNumber}</span>
                    </div>
                    <div className={styles.auditionee_name}>
                      Name:{" "}
                      <span className={styles.input_mimic}>{auditionee.name}</span>
                    </div>
                  </div>
                  <div className={styles.audition_type}>
                    Auditioning for:{" "}
                    <span className={styles.input_mimic}>
                      {auditionee.auditionTypes.join(", ")}
                    </span>
                  </div>
                  <div className={styles.congregation}>
                    Congregation:{" "}
                    <span className={styles.input_mimic}>{auditionee.congregation || "N/A"}</span>
                  </div>
                  <div className={styles.observations}>
                    <div>Observations:</div>
                    <div className={styles.input_mimic}>{auditionee.observations || "N/A"}</div>
                  </div>
                  <div className={styles.audition_link}>
                    <div>Audition Link:</div>
                    <a
                      target="_blank"
                      className={styles.input_mimic}
                      href={auditionee.auditionLink}
                    >
                      {auditionee.auditionLink ? "Click here to open" : "N/A"}
                    </a>
                  </div>

                  {/* Judge Scores */}
                  <div className={styles.judge_scores}>
                    <div>Judge 1 Score:</div>
                    <span className={styles.input_mimic}>{auditionee.judge1Score || "N/A"}</span>
                  </div>
                  <div className={styles.judge_scores}>
                    <div>Judge 2 Score:</div>
                    <span className={styles.input_mimic}>{auditionee.judge2Score || "N/A"}</span>
                  </div>
                  <div className={styles.judge_scores}>
                    <div>Judge 3 Score:</div>
                    <span className={styles.input_mimic}>{auditionee.judge3Score || "N/A"}</span>
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
                    <span className={styles.input_mimic}>{auditionee.pitch || "N/A"}</span>
                  </div>
                  <div>
                    <div className={styles.category}>Rhythm:</div>
                    <span className={styles.input_mimic}>{auditionee.rhythm || "N/A"}</span>
                  </div>
                  <div className={styles.rov}>
                    <div className={styles.category}>ROV:</div>
                    <span className={styles.input_mimic}>
                      {auditionee.rangeOfVoice || "N/A"}
                    </span>
                    <div className={styles.rov_low}>(Range of voice)</div>
                  </div>
                  <div>
                    <div className={styles.category}>Harmony:</div>
                    <span className={styles.input_mimic}>{auditionee.harmony || "N/A"}</span>
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
                    <span className={styles.input_mimic}>{auditionee.instrument || "N/A"}</span>
                  </div>
                  <div>
                    <div className={styles.instrument_category}>Reading:</div>
                    <span className={styles.input_mimic}>{auditionee.reading || "N/A"}</span>
                  </div>
                  <div>
                    <div className={styles.instrument_category}>Level:</div>
                    <span className={styles.input_mimic}>{auditionee.level || "N/A"}</span>
                  </div>
                </div>

                {/* Result Buttons */}
                <div className={styles.result_buttons}>
                  {["Accept", "Decline", "Backup"].map((option) => (
                    <button
                      key={option}
                      onClick={() => handleResultUpdate(auditionee.auditioneeNumber, option)}
                      className={`${styles.result_button} ${
                        auditionee.result === option ? styles.selected_button : ""
                      }`}
                      disabled={buttonLoading[auditionee.auditioneeNumber] === option}
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
    // </PasswordProtect>
  );
}
