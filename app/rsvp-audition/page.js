"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import styles from './Rsvp-audition.module.css';

import logo from '../../public/fort-lauderdale-2025-logo.svg'

function RsvpAuditionContent() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    ticketId: "",
    name: "",
    email: "",
    phoneNumber: "",
    guestName: "",
    guestEmail: "",
  });
  const [message, setMessage] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true); // Loading state to control initial display

  useEffect(() => {
    setIsClient(true);

    const ticketId = searchParams.get("ticketId");

    if (isClient && ticketId) {
      console.log("fetching ticket data");

      // Fetch the existing data if `ticketId` is present in the URL
      fetch(`/api/fetch-ticket-info?ticketId=${ticketId}`)
        .then((res) => res.json())
        .then((data) => {
          console.log("data:", data);
          if (data.success) {
            setFormData({
              ticketId,
              name: data.name,
              email: data.email,
              phoneNumber: data.phoneNumber || "",
              guestName: "",
              guestEmail: "",
            });
            setMessage("");
          } else {
            setMessage(data.message);
          }
        })
        .catch((error) => {
          console.error("Error fetching ticket info:", error);
          setMessage("Error loading ticket information.");
        })
        .finally(() => setLoading(false)); // Set loading to false once data is loaded
    } else if (!ticketId) {
      setMessage("No ticket ID provided. Please check your RSVP link.");
      setLoading(false); // Stop loading if ticketId is missing
    }
  }, [isClient, searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Submitting...");

    const response = await fetch("/api/rsvp-audition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const result = await response.json();
    setMessage(result.message);
  };

  if (loading) {
    return <p>Loading...</p>; // Display loading message while checking ticket ID
  }

  if (!isClient || !formData.ticketId) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h1>Invalid RSVP Link</h1>
        <p>{message}</p>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center" }} className={styles.page_wrap}>
      <div className={styles.page_conent}>
        <img src={logo.src} alt="" className={styles.logo} />
        <h1 style={{marginTop: '30px'}}>Welcome</h1>
        <p>Please RSVP for the auditions using the form below</p>
        {message ? <p className={styles.result_message}>{message}</p> : <></>}
        <form onSubmit={handleSubmit} style={{ maxWidth: "400px", margin: "40px 0 100px 0", display: "flex", flexDirection: "column", gap: "30px", width: "100%", alignItems: "center"}}>
          <div className={styles.input_wrap}>
            <input type="text" name="ticketId" value={formData.ticketId} readOnly />
            <div className={styles.input_desc}>
              Ticket ID *
            </div>
          </div>
          <div className={styles.input_wrap}>
            <input type="text" name="name" value={formData.name} onChange={handleChange} />
            <div className={styles.input_desc}>
              Name *
            </div>
          </div>
          <div className={styles.input_wrap}>
            <input type="email" name="email" value={formData.email} onChange={handleChange} />
            <div className={styles.input_desc}>
              Email *
            </div>
          </div>
          <div className={styles.input_wrap}>
            <input type="text" name="phoneNumber" placeholder="" value={formData.phoneNumber} onChange={handleChange} />
            <div className={styles.input_desc}>
              Phone Number
            </div>
          </div>
          <div className={styles.input_wrap}>
            <input type="text" name="guestName" placeholder="" onChange={handleChange} />
            <div className={styles.input_desc}>
              Guest Name
            </div>
          </div>
          <div className={styles.input_wrap}>
            <input type="email" name="guestEmail" placeholder="" onChange={handleChange} />
            <div className={styles.input_desc}>
              Guest Email
            </div>
          </div>
          <button type="submit" className={styles.rsvp_button}>Confirm RSVP</button>
        </form>
      </div>
    </div>
  );
}

export default function RsvpAudition() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <RsvpAuditionContent />
    </Suspense>
  );
}
