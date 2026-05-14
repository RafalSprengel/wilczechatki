"use client";
import { useState } from "react";
import Button from "@/app/_components/UI/Button/Button";
import styles from "./ContactForm.module.css";

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export default function ContactForm() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    message: "",
  });
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    message: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const errors = {
    name: formData.name.length < 3 ? "Proszę podać imię i nazwisko." : "",
    email: !emailRegex.test(formData.email)
      ? "Proszę podać poprawny adres e-mail."
      : "",
    message:
      formData.message.length < 10
        ? "Wiadomość powinna mieć min. 10 znaków."
        : "",
  };

  const isFormValid = !errors.name && !errors.email && !errors.message;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setTouched({ name: true, email: true, message: true });

    if (!isFormValid) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        if (!result.message) {
          throw new Error("Nie udało się wysłać wiadomości.");
        }

        throw new Error(result.message);
      }

      setIsSubmitted(true);
      setFormData({ name: "", email: "", message: "" });
      setTouched({ name: false, email: false, message: false });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nie udało się wysłać wiadomości.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className={styles.successContainer}>
        <p className={styles.successMessage}>Wiadomość została wysłana!</p>
        <Button
          onClick={() => {
            setIsSubmitted(false);
            setSubmitError(null);
          }}
          type="button"
        >
          Wyślij kolejną wiadomość
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit}>
        <div className={styles.group}>
          <label htmlFor="name">Imię i Nazwisko</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            className={styles.input}
          />
          {touched.name && errors.name && (
            <div className={styles.errorMessage}>{errors.name}</div>
          )}
        </div>

        <div className={styles.group}>
          <label htmlFor="email">Adres e-mail</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            className={styles.input}
          />
          {touched.email && errors.email && (
            <div className={styles.errorMessage}>{errors.email}</div>
          )}
        </div>

        <div className={styles.group}>
          <label htmlFor="message">Wiadomość</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            onBlur={handleBlur}
            className={styles.textarea}
          ></textarea>
          {touched.message && errors.message && (
            <div className={styles.errorMessage}>{errors.message}</div>
          )}
        </div>

        {submitError && (
          <div className={styles.errorMessage}>{submitError}</div>
        )}

        <Button type="submit" fullWidth disabled={!isFormValid || isSubmitting}>
          {isSubmitting ? (
            <span className={styles.loadingContent}>
              <span className={styles.spinner} aria-hidden="true" />
              <span>Loading...</span>
            </span>
          ) : (
            "Wyślij wiadomość"
          )}
        </Button>
      </form>
    </div>
  );
}
