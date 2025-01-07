"use client";

import { useState } from 'react';
import Link from "next/link";
import styles from './page.module.css';

import logo from '../public/fort-lauderdale-2025-logo.svg'

import PasswordProtect from './components/PasswordProtect';

export default function Send() {
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
    // <PasswordProtect>
    <div className={styles.page_wrap}>
      <nav className={styles.nav} style={{ marginBottom: "20px" }}>
        <Link href="./audition">
          <button className={styles.nav_button}>Audition</button>
        </Link>
        <Link href="./results">
          <button className={styles.nav_button}>Results</button>
        </Link>
      </nav>
      <img src={logo.src} className={styles.logo} alt="logo" />
      <h1>Send audition invite email</h1>
      <button onClick={sendTestEmail} disabled={isSending}>
        {isSending ? 'Sending...' : 'Send Email'}
      </button>
      {message && <p>{message}</p>}
      
      <h1>
        Send audition result email
      </h1>
      <button
        onClick={handleSendResultsEmails}
        style={{ padding: "10px 20px", fontSize: "16px", cursor: "pointer" }}
        disabled={loading}
      >
        {loading ? "Sending Emails..." : "Send Results Emails"}
      </button>
    </div>
    // </PasswordProtect>

  );
}
