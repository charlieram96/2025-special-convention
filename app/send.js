"use client";

import { useState } from 'react';

export default function Send() {
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');

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
          to: 'rjtechnology06@hotmail.com',
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
    <div>
      <h1>Send Test Email</h1>
      <button onClick={sendTestEmail} disabled={isSending}>
        {isSending ? 'Sending...' : 'Send Email'}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}
