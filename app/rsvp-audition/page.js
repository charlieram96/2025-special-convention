"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

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

    const response = await fetch("/api/rsvp", {
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

export default function RsvpAudition() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <RsvpAuditionContent />
    </Suspense>
  );
}
