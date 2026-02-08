'use client';
import { useEffect, useState } from 'react';
import { useForm } from '@formspree/react';
import styles from './ContactForm.module.css';

export default function ContactForm() {
  const [state, handleSubmit] = useForm("mgokvlpj");
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleCustomSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = String(formData.get('name') || '');
    const message = String(formData.get('message') || '');
    const email = String(formData.get('email') || '');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const newErrors = {
      name: name.length < 3 ? "Proszę podać imię i nazwisko." : '',
      email: !emailRegex.test(email) || email.length === 0 ? "Proszę podać poprawny adres e-mail (np. nazwa@domena.pl)." : '',
      message: message.length < 10 ? "Proszę napisać wiadomość." : ''
    };
    setErrors(newErrors);

    if (newErrors.name || newErrors.email || newErrors.message) {
      return;
    }
    handleSubmit(e);
  };

  if (state.succeeded) {
    return (
      <div className={styles.successContainer}>
        <p className={styles.successMessage}>Wiadomość została wysłana!</p>
        <button
          onClick={() => window.location.reload()}
          className={styles.submitBtn}
        >
          Wyślij kolejną wiadomość
        </button>
      </div>
    );
  }

  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleCustomSubmit}>
        <div className={styles.group}>
          <label htmlFor="name">Imię i Nazwisko</label>
          <input
            type="text"
            id="name"
            name="name"
            className={styles.input}
          />
          {errors?.name && <div className={styles.errorMessage}>{errors?.name}</div>}
        </div>

        <div className={styles.group}>
          <label htmlFor="email">Adres E-mail</label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            className={styles.input}
          />
          {errors?.email && <div className={styles.errorMessage}>{errors?.email}</div>}
        </div>

        <div className={styles.group}>
          <label htmlFor="message">Wiadomość</label>
          <textarea
            id="message"
            name="message"
            className={styles.textarea}
          ></textarea>
          {errors?.message && <div className={styles.errorMessage}>{errors?.message}</div>}
        </div>

        {state.errors && (
          <div className={styles.serverErrorMessage}>
            Przepraszamy, wystąpił problem z wysłaniem formularza. Spróbuj ponownie później.
          </div>
        )}

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={state.submitting}
        >
          {state.submitting ? "Wysyłanie..." : "Wyślij wiadomość"}
        </button>
      </form>
    </div>
  );
}