'use client';

import { useState } from 'react';
import styles from './ContactForm.module.css';

export default function ContactForm() {
  const [status, setStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Sending...');
    
    setTimeout(() => {
      setStatus('Message sent successfully!');
      (e.target as HTMLFormElement).reset();
    }, 1500);
  };

  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit}>
        <div className={styles.group}>
          <label htmlFor="name">Imię i Nazwisko</label>
          <input type="text" id="name" name="name" required className={styles.input} />
        </div>
        
        <div className={styles.group}>
          <label htmlFor="email">Adres E-mail</label>
          <input type="email" id="email" name="email" required className={styles.input} />
        </div>

        <div className={styles.group}>
          <label htmlFor="message">Wiadomość</label>
          <textarea id="message" name="message" required className={styles.textarea}></textarea>
        </div>

        <button type="submit" className={styles.submitBtn}>
          Wyślij wiadomość
        </button>

        {status && <p style={{ marginTop: '15px', textAlign: 'center', color: 'var(--accent-color)' }}>{status}</p>}
      </form>
    </div>
  );
}