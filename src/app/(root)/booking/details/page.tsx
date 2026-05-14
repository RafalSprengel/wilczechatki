"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Button from "@/app/_components/UI/Button/Button";
import FloatingBackButton from "@/app/_components/FloatingBackButton/FloatingBackButton";
import type { BookingData, ClientData, InvoiceData } from "@/types/booking";
import { formatDisplayDate } from "@/utils/formatDate";
import styles from "./page.module.css";

interface GuestData extends ClientData {
  invoice: boolean;
  invoiceData: InvoiceData;
  termsAccepted: boolean;
}

const STORAGE_KEY = "wilczechatki_booking_draft";

export default function BookingDetailsPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<GuestData>({
    firstName: "",
    lastName: "",
    address: "",
    email: "",
    phone: "",
    invoice: false,
    invoiceData: {
      companyName: "",
      nip: "",
      street: "",
      city: "",
      postalCode: "",
    },
    termsAccepted: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bookingSummary, setBookingSummary] = useState<BookingData | null>(
    null,
  );

  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed: BookingData = JSON.parse(savedData);

        if (
          !Array.isArray(parsed.orders) ||
          parsed.orders.length === 0 ||
          !Number.isInteger(parsed.adults) ||
          parsed.adults < 1 ||
          !Number.isInteger(parsed.children) ||
          parsed.children < 0
        ) {
          router.push("/booking");
          return;
        }

        setBookingSummary(parsed);
        const hasInvoiceData = Boolean(
          parsed.invoiceData.companyName ||
            parsed.invoiceData.nip ||
            parsed.invoiceData.street ||
            parsed.invoiceData.city ||
            parsed.invoiceData.postalCode,
        );

        setFormData((prev) => ({
          ...prev,
          ...parsed.clientData,
          invoice: hasInvoiceData,
          invoiceData: parsed.invoiceData,
        }));
      } catch {
        router.push("/booking");
      }
    } else {
      router.push("/booking");
    }
  }, [router]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = "Imię jest wymagane";
    if (!formData.lastName.trim())
      newErrors.lastName = "Nazwisko jest wymagane";
    if (!formData.address.trim()) newErrors.address = "Adres jest wymagany";

    if (!formData.email.trim()) {
      newErrors.email = "E-mail jest wymagany";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Nieprawidłowy format e-mail";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Telefon jest wymagany";
    } else if (!/^[\d\s+\-()]+$/.test(formData.phone)) {
      newErrors.phone = "Nieprawidłowy format telefonu";
    }

    if (formData.invoice) {
      if (!formData.invoiceData?.companyName.trim()) {
        newErrors.companyName = "Nazwa firmy jest wymagana dla faktury VAT";
      }
      if (!formData.invoiceData?.nip.trim()) {
        newErrors.nip = "NIP jest wymagany dla faktury VAT";
      } else if (
        !/^[\d-]{10,13}$/.test(formData.invoiceData.nip.replace(/-/g, ""))
      ) {
        newErrors.nip = "Nieprawidłowy format NIP";
      }
      if (!formData.invoiceData?.street.trim()) {
        newErrors.invoiceStreet = "Ulica jest wymagana dla faktury VAT";
      }
      if (!formData.invoiceData?.city.trim()) {
        newErrors.invoiceCity = "Miejscowość jest wymagana dla faktury VAT";
      }
      if (!formData.invoiceData?.postalCode.trim()) {
        newErrors.postalCode = "Kod pocztowy jest wymagany dla faktury VAT";
      }
    }

    if (!formData.termsAccepted)
      newErrors.termsAccepted = "Musisz zaakceptować regulamin";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    if (name === "invoice") {
      setFormData((prev) => ({
        ...prev,
        invoice: checked,
        ...(checked && !prev.invoiceData
          ? {
              invoiceData: {
                companyName: "",
                nip: "",
                street: "",
                city: "",
                postalCode: "",
              },
            }
          : {}),
      }));
    } else if (name.startsWith("invoice.")) {
      const invoiceField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        invoiceData: {
          ...prev.invoiceData!,
          [invoiceField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleTermAndConditionsClick = () => {
    const nextInvoiceData = formData.invoice
      ? formData.invoiceData
      : {
          companyName: "",
          nip: "",
          street: "",
          city: "",
          postalCode: "",
        };

    const updatedData: BookingData = {
      ...(bookingSummary as BookingData),
      clientData: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        address: formData.address,
        email: formData.email,
        phone: formData.phone,
      },
      invoiceData: nextInvoiceData,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));

    router.push("/terms-and-conditions");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    const nextInvoiceData = formData.invoice
      ? formData.invoiceData
      : {
          companyName: "",
          nip: "",
          street: "",
          city: "",
          postalCode: "",
        };

    const updatedData: BookingData = {
      ...(bookingSummary as BookingData),
      clientData: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        address: formData.address,
        email: formData.email,
        phone: formData.phone,
      },
      invoiceData: nextInvoiceData,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    await new Promise((resolve) => setTimeout(resolve, 500));
    router.push("/booking/summary");
  };

  if (!bookingSummary) {
    return (
      <div className={styles.container}>
        <FloatingBackButton />
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Ładowanie danych rezerwacji...</p>
        </div>
      </div>
    );
  }

  const { startDate, endDate, orders } = bookingSummary;
  const totalGuests = orders.reduce((sum, item) => sum + item.guests, 0);
  const totalExtraBeds = orders.reduce((sum, item) => sum + item.extraBeds, 0);
  const totalPrice = orders.reduce((sum, item) => sum + item.price, 0);
  const orderDisplayName =
    orders.length === 1
      ? orders[0].displayName
      : `${orders.length} obiekty: ${orders.map((item) => item.displayName).join(", ")}`;

  const nights = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  return (
    <div className={styles.container}>
      <FloatingBackButton />
      <header className={styles.header}>
        <h1>Dane gości</h1>
        <p>Wypełnij formularz, aby kontynuować rezerwację.</p>
      </header>

      <div className={styles.summaryCard}>
        <h2 className={styles.summaryTitle}>Dane rezerwacji</h2>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Obiekt:</span>
            <span className={styles.summaryValue}>{orderDisplayName}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Termin:</span>
            <span className={styles.summaryValue}>
              {formatDisplayDate(startDate)} — {formatDisplayDate(endDate)} (
              {nights} nocy)
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Goście:</span>
            <span className={styles.summaryValue}>
              {totalGuests} osób
              {totalExtraBeds > 0 &&
                ` + ${totalExtraBeds} dostawka${totalExtraBeds > 1 ? "i" : ""}`}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Cena całkowita:</span>
            <span className={styles.summaryPrice}>{totalPrice} zł</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.formCard}>
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Dane osobowe</h2>
          <div className={styles.grid}>
            <div className={styles.inputGroup}>
              <label htmlFor="firstName">Imię *</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                className={errors.firstName ? styles.inputError : ""}
                autoComplete="given-name"
              />
              {errors.firstName && (
                <span className={styles.errorText}>{errors.firstName}</span>
              )}
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="lastName">Nazwisko *</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                className={errors.lastName ? styles.inputError : ""}
                autoComplete="family-name"
              />
              {errors.lastName && (
                <span className={styles.errorText}>{errors.lastName}</span>
              )}
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="address">Adres *</label>
            <input
              id="address"
              name="address"
              type="text"
              value={formData.address}
              onChange={handleChange}
              placeholder="Ulica, numer, kod pocztowy, miejscowość"
              className={errors.address ? styles.inputError : ""}
              autoComplete="street-address"
            />
            {errors.address && (
              <span className={styles.errorText}>{errors.address}</span>
            )}
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Dane kontaktowe</h2>
          <div className={styles.grid}>
            <div className={styles.inputGroup}>
              <label htmlFor="email">E-mail *</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? styles.inputError : ""}
                autoComplete="email"
              />
              {errors.email && (
                <span className={styles.errorText}>{errors.email}</span>
              )}
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="phone">Telefon *</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+48 123 456 789"
                className={errors.phone ? styles.inputError : ""}
                autoComplete="tel"
              />
              {errors.phone && (
                <span className={styles.errorText}>{errors.phone}</span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Dodatkowe opcje</h2>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="invoice"
              checked={formData.invoice}
              onChange={handleChange}
            />
            <span>Chcę otrzymać fakturę VAT</span>
          </label>

          <div
            className={`${styles.invoiceWrapper} ${formData.invoice ? styles.expanded : ""}`}
          >
            <div className={styles.invoiceContent}>
              <h3 className={styles.invoiceTitle}>Dane do faktury VAT</h3>

              <div
                className={`${styles.inputGroup} ${styles.fadeIn}`}
                style={{ animationDelay: "0.05s" }}
              >
                <label htmlFor="invoice.companyName">Nazwa firmy *</label>
                <input
                  id="invoice.companyName"
                  name="invoice.companyName"
                  type="text"
                  value={formData.invoiceData.companyName}
                  onChange={handleChange}
                  className={errors.companyName ? styles.inputError : ""}
                  placeholder="Pełna nazwa firmy"
                />
                {errors.companyName && (
                  <span className={styles.errorText}>{errors.companyName}</span>
                )}
              </div>

              <div
                className={`${styles.inputGroup} ${styles.fadeIn}`}
                style={{ animationDelay: "0.1s" }}
              >
                <label htmlFor="invoice.nip">NIP *</label>
                <input
                  id="invoice.nip"
                  name="invoice.nip"
                  type="text"
                  value={formData.invoiceData.nip}
                  onChange={handleChange}
                  className={errors.nip ? styles.inputError : ""}
                  placeholder="123-456-78-90"
                />
                {errors.nip && (
                  <span className={styles.errorText}>{errors.nip}</span>
                )}
              </div>

              <div
                className={`${styles.inputGroup} ${styles.fadeIn}`}
                style={{ animationDelay: "0.15s" }}
              >
                <label htmlFor="invoice.street">Ulica i numer *</label>
                <input
                  id="invoice.street"
                  name="invoice.street"
                  type="text"
                  value={formData.invoiceData.street}
                  onChange={handleChange}
                  className={errors.invoiceStreet ? styles.inputError : ""}
                  placeholder="ul. Przykładowa 123"
                />
                {errors.invoiceStreet && (
                  <span className={styles.errorText}>
                    {errors.invoiceStreet}
                  </span>
                )}
              </div>

              <div
                className={`${styles.grid} ${styles.fadeIn}`}
                style={{ animationDelay: "0.2s" }}
              >
                <div className={styles.inputGroup}>
                  <label htmlFor="invoice.postalCode">Kod pocztowy *</label>
                  <input
                    id="invoice.postalCode"
                    name="invoice.postalCode"
                    type="text"
                    value={formData.invoiceData.postalCode}
                    onChange={handleChange}
                    className={errors.postalCode ? styles.inputError : ""}
                    placeholder="00-000"
                  />
                  {errors.postalCode && (
                    <span className={styles.errorText}>
                      {errors.postalCode}
                    </span>
                  )}
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="invoice.city">Miejscowość *</label>
                  <input
                    id="invoice.city"
                    name="invoice.city"
                    type="text"
                    value={formData.invoiceData.city}
                    onChange={handleChange}
                    className={errors.invoiceCity ? styles.inputError : ""}
                    placeholder="Miejscowość"
                  />
                  {errors.invoiceCity && (
                    <span className={styles.errorText}>
                      {errors.invoiceCity}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Akceptacja regulaminu</h2>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="termsAccepted"
              checked={formData.termsAccepted}
              onChange={handleChange}
            />
            <span>
              Zapoznałem/am się i akceptuję{" "}
              <button
                type="button"
                onClick={handleTermAndConditionsClick}
                className={styles.linkButton}
              >
                regulamin obiektu
              </button>{" "}
              *
            </span>
          </label>
          {errors.termsAccepted && (
            <span className={styles.errorText}>{errors.termsAccepted}</span>
          )}
        </div>

        <div className={styles.formActions}>
          <Button href="/booking" variant="secondary">
            ← Wstecz
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Zapisywanie..." : "Dalej →"}
          </Button>
        </div>
      </form>
    </div>
  );
}
