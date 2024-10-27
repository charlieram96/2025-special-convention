"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function Tes() {
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
