"use client";

import { useState, useEffect } from 'react';

import logo from '../../public/fort-lauderdale-2025-logo.svg';

export default function PasswordProtect({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if the user is already authenticated
    const auth = localStorage.getItem('auth');
    // if (auth === 'authenticated') {
    //   setIsAuthenticated(true);
    // }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const password = process.env.NEXT_PUBLIC_PASSWORD_PROTECT;

    if (passwordInput === password) {
      localStorage.setItem('auth', 'authenticated');
      setIsAuthenticated(true);
    } else {
      setError('Incorrect password');
    }
  };

  if (isAuthenticated) {
    return children;
  } else {
    return (
      <>
        {/* We embed our style here: */}
        <style jsx>{`
          .password-logo {
            position: absolute;
            top: 50px;
            /* Default to 300px width for large screens */
            width: 300px;
          }

          @media (max-width: 1200px) {
            .password-logo {
              /* On screens below 1200px, set width to 200px */
              width: 200px;
            }

            .password-modal h1 {
              font-size: 26px;
            }
          }

          .password-overlay {
            position: fixed;
            top: 0; left: 0;
            width: 100%;
            height: 100%;
            background-color: #E8FCFF;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 9999;
          }

          .password-modal {
            background-color: #fff;
            padding: 30px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }

          .password-input {
            padding: 10px;
            font-size: 16px;
            margin-right: 10px;
            margin-top: 20px;
            background-color: #fff;
            outline: none;
            border: 1.5px solid #9CDBED;
            border-radius: 3px;
            color: #0088AD;
          }

          .password-button {
            padding: 10px 20px;
            font-size: 16px;
            cursor: pointer;
          }

          .password-error {
            color: red;
            margin-top: 20px;
          }
        `}</style>

        <div className="password-overlay">
          <div className="password-modal">
            <h1 style={{ marginBottom: "10px", color: "#0088AD" }}>Welcome</h1>
            <p style={{ marginBottom: "20px", color: "#555" }}>Please Enter the Password</p>
            <form onSubmit={handleSubmit}>
              <input
                type="password"
                placeholder="Password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="password-input"
              />
              <button type="submit" className="password-button">
                Enter
              </button>
            </form>
            {error && <p className="password-error">{error}</p>}
          </div>
        </div>
      </>
    );
  }
}
