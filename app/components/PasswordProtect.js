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

    // Check the password
    const password = process.env.NEXT_PUBLIC_PASSWORD_PROTECT;
    if (passwordInput === password) {
      // Set authentication in localStorage
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
      <div style={styles.overlay}>
        
        <img src={logo.src} style={styles.logo} alt="logo" />

        <div style={styles.modal}>
          <h1>Please Enter the Password</h1>
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              placeholder="Password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              style={styles.input}
            />
            <button type="submit" style={styles.button}>
              Enter
            </button>
          </form>
          {error && <p style={styles.error}>{error}</p>}
        </div>
      </div>
    );
  }
}

const styles = {
  logo: {
    height: '300px',
    position: 'absolute',
    top: '50px',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#E8FCFF',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modal: {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '8px',
    textAlign: 'center',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  input: {
    padding: '10px',
    fontSize: '16px',
    marginRight: '10px',
    marginTop: '20px',
    backgroundColor: '#fff',
    outline: 'none',
    border: '1.5px solid #9CDBED',
    borderRadius: '3px',
    color: '#0088AD',
  },
  button: {
    padding: '10px 20px',
    fontSize: '16px',
  },
  error: {
    color: 'red',
    marginTop: '20px',
  },
};
