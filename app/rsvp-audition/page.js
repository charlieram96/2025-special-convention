"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RsvpAudition() {
  const router = useRouter();
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

  useEffect(() => {
    // Ensure we are on the client side before accessing router
    setIsClient(true);

    if (isClient) {
      const { ticketId } = router.query;
      if (!ticketId) {
        setMessage("No ticket ID provided. Please check your RSVP link.");
        return;
      }

      // Fetch the existing data if `ticketId` is present in the URL
      fetch(`/api/fetch-ticket-info?ticketId=${ticketId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setFormData({
              ticketId: ticketId,
              name: data.name,
              email: data.email,
              phoneNumber: data.phoneNumber || "",
              guestName: "",
              guestEmail: "",
            });
          } else {
            setMessage(data.message);
          }
        })
        .catch((error) => {
          console.error("Error fetching ticket info:", error);
          setMessage("Error loading ticket information.");
        });
    }
  }, [isClient]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Submitting...");

    const response = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const result = await response.json();
    setMessage(result.message);
  };

  if (!isClient || !formData.ticketId) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h1>Invalid RSVP Link</h1>
        <p>{message}</p>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>RSVP for the Event</h1>
      <p>{message}</p>
      <form onSubmit={handleSubmit} style={{ maxWidth: "400px", margin: "0 auto" }}>
        <input type="text" name="ticketId" value={formData.ticketId} readOnly /><br />
        <input type="text" name="name" value={formData.name} readOnly /><br />
        <input type="email" name="email" value={formData.email} readOnly /><br />
        <input type="text" name="phoneNumber" placeholder="Phone Number" value={formData.phoneNumber} onChange={handleChange} /><br />
        <input type="text" name="guestName" placeholder="Guest Name" onChange={handleChange} /><br />
        <input type="email" name="guestEmail" placeholder="Guest Email" onChange={handleChange} /><br />
        <button type="submit">Confirm RSVP</button>
      </form>
    </div>
  );
}
