"use client";

import { useState } from 'react';
import Link from "next/link";
import styles from './page.module.css';

import fortLauderdaleLogo from '../public/fort-lauderdale-2025-logo.svg'
import panamaLogo from '../public/panama-2026-logo.svg'

import PasswordProtect from './components/PasswordProtect';
import { useDatabase } from './contexts/DatabaseContext';

export default function Send() {
  const { selectedDatabase, selectDatabase, DATABASES } = useDatabase();
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);


  const handleSendResultsEmails = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/send-results-email", { method: "POST" });
      const result = await response.json();
      alert(result.message);
    } catch (error) {
      console.error("Error sending results emails:", error);
      alert("Failed to send emails. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to send a test email
  const sendTestEmail = async () => {
    setIsSending(true);

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'charlieram96@gmail.com',
          subject: 'Audition Invitation',
          text: 'This is a test email sent from Next.js using SendGrid.',
        }),
      }); 

      const data = await response.json();

      if (response.ok) {
        setMessage('Email sent successfully!');
      } else {
        setMessage(`Failed to send email: ${data.error}`);
      }
    } catch (error) {
      setMessage('Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <PasswordProtect>
    <div className={styles.page_wrap}>
      {/* Database Selection Section */}
      <div style={{ 
        marginBottom: "30px", 
        padding: "20px 30px",
        maxWidth: "100%",
        display: "flex",
        flexDirection: "column"
      }}>
        <h2 style={{ 
          color: "#0088AD", 
          marginBottom: "20px",
          fontSize: "24px",
          fontWeight: "700",
          textAlign: "center"
        }}>
          Select Convention Database
        </h2>
        <div style={{ 
          maxWidth: "800px",
          margin: "0 auto",
          
        }}>
          <p style={{ 
            marginBottom: "15px",
            color: "#555",
            fontSize: "14px",
            textAlign: "center"
          }}>
            Currently: <strong style={{ color: "#0088AD" }}>{selectedDatabase.name}</strong>
          </p>
          <div style={{ 
            display: "flex", 
            gap: "15px", 
            justifyContent: "center",
            flexWrap: "wrap",
            alignItems: "center"
          }}>
            <button
              onClick={() => selectDatabase(DATABASES.FORT_LAUDERDALE_2025)}
              style={{
                padding: "12px 20px",
                fontSize: "16px",
                fontWeight: "700",
                backgroundColor: selectedDatabase.id === DATABASES.FORT_LAUDERDALE_2025.id ? "#0088AD" : "#addbe3",
                color: "#fff",
                border: selectedDatabase.id === DATABASES.FORT_LAUDERDALE_2025.id ? "3px solid #005f7f" : "3px solid transparent",
                borderRadius: "10px",
                cursor: "pointer",
                transition: "all 0.3s ease",
                whiteSpace: "nowrap"
              }}
            >
              {DATABASES.FORT_LAUDERDALE_2025.name}
            </button>
            <button
              onClick={() => selectDatabase(DATABASES.PANAMA_2026)}
              style={{
                padding: "12px 20px",
                fontSize: "16px",
                fontWeight: "700",
                backgroundColor: selectedDatabase.id === DATABASES.PANAMA_2026.id ? "#0088AD" : "#addbe3",
                color: "#fff",
                border: selectedDatabase.id === DATABASES.PANAMA_2026.id ? "3px solid #005f7f" : "3px solid transparent",
                borderRadius: "10px",
                cursor: "pointer",
                transition: "all 0.3s ease",
                whiteSpace: "nowrap"
              }}
            >
              {DATABASES.PANAMA_2026.name}
            </button>
          </div>
        </div>
      </div>

      <nav className={styles.nav} style={{ marginBottom: "20px" }}>
        <Link href="./audition">
          <button className={styles.nav_button}>Audition</button>
        </Link>
        <Link href="./results">
          <button className={styles.nav_button}>Results</button>
        </Link>
      </nav>
      <img src={selectedDatabase.id === DATABASES.PANAMA_2026.id ? panamaLogo.src : fortLauderdaleLogo.src} className={styles.logo} alt="logo" />
      {/* <h1>Send invite email</h1> */}
      {/* <button onClick={sendTestEmail} disabled={isSending}> */}
      {/* <button onClick={sendTestEmail}>
        {isSending ? 'Sending...' : 'Send Email'}
      </button>
      {message && <p>{message}</p>} */}
      
      {/* <h1>
        Send audition result email
      </h1>
      <button
        onClick={handleSendResultsEmails}
        style={{ padding: "10px 20px", fontSize: "16px", cursor: "pointer" }}
        
      >
        {loading ? "Sending Emails..." : "Send Results Emails"}
      </button> */}
    </div>
    </PasswordProtect>

  );
}
