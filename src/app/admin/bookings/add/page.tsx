"use client";

import type React from "react";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  calculatePriceAction,
  createBookingByAdmin,
  getUnavailableDatesForProperty,
} from "@/actions/adminBookingActions";
import { getAllProperties } from "@/actions/adminPropertyActions";
import { getBookingConfig } from "@/actions/bookingConfigActions";
import Button from "@/app/_components/UI/Button/Button";
import CalendarPicker, {
  type DatesData,
} from "@/app/_components/CalendarPicker/CalendarPicker";
import FloatingBackButton from "@/app/_components/FloatingBackButton/FloatingBackButton";
import Modal from "@/app/_components/Modal/Modal";
import QuantityPicker from "@/app/_components/QuantityPicker/QuantityPicker";
import { useClickOutside } from "@/hooks/useClickOutside";
import { formatDisplayDate } from "@/utils/formatDate";
import styles from "./page.module.css";

interface BookingDates {
  start: string | null;
  end: string | null;
  count: number;
}

interface PropertyOption {
  _id: string;
  name: string;
  maxAdults: number;
  maxExtraBeds: number;
}

interface InvoiceData {
  companyName: string;
  nip: string;
  street: string;
  postalCode: string;
  city: string;
}

const initialState = {
  message: "",
  success: false,
};

export default function AddBookingPage() {
  const [state, formAction, isPending] = useActionState(
    createBookingByAdmin,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [propertySelection, setPropertySelection] = useState("");
  const [selectedProperty, setSelectedProperty] =
    useState<PropertyOption | null>(null);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [extraBeds, setExtraBeds] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [bookingDates, setBookingDates] = useState<BookingDates>({
    start: null,
    end: null,
    count: 0,
  });
  const [isCalendarOpen, setCalendarOpen] = useState(false);
  const [calendarDates, setCalendarDates] = useState<DatesData>({});
  const [isLoadingUnavailableDates, setIsLoadingUnavailableDates] =
    useState(false);
  const [hasLoadedUnavailableDates, setHasLoadedUnavailableDates] =
    useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const priceRequestIdRef = useRef(0);
  const [isCalculating, startPriceCalculation] = useTransition();
  const [wantsInvoice, setWantsInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    companyName: "",
    nip: "",
    street: "",
    postalCode: "",
    city: "",
  });
  const [invoiceErrors, setInvoiceErrors] = useState<Record<string, string>>(
    {},
  );
  const [minBookingDays, setMinBookingDays] = useState(1);
  const [maxBookingDays, setMaxBookingDays] = useState(30);
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
  });

  const isDateRangeSelected = !!(bookingDates.start && bookingDates.end);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoadingProperties(true);
      try {
        const [props, config] = await Promise.all([
          getAllProperties(),
          getBookingConfig(),
        ]);
        setProperties(props);
        setMinBookingDays(config.minBookingDays);
        setMaxBookingDays(config.maxBookingDays);
      } finally {
        setIsLoadingProperties(false);
      }
    };
    loadInitialData();
  }, []);

  const selectedPropertyMaxAdults = selectedProperty?.maxAdults ?? null;
  const selectedPropertyMaxExtraBeds = selectedProperty?.maxExtraBeds ?? null;

  useEffect(() => {
    setBookingDates({ start: null, end: null, count: 0 });
    setTotalPrice(0);
  }, [propertySelection]);

  useEffect(() => {
    if (propertySelection) {
      const prop = properties.find((p) => p._id === propertySelection);
      setSelectedProperty(prop || null);
    } else {
      setSelectedProperty(null);
    }
  }, [propertySelection, properties]);

  useEffect(() => {
    if (selectedProperty) {
      if (
        selectedPropertyMaxAdults != null &&
        adults > selectedPropertyMaxAdults
      ) {
        setAdults(Math.min(2, selectedPropertyMaxAdults));
      }
      if (children < 0) setChildren(0);
      if (
        selectedPropertyMaxExtraBeds != null &&
        extraBeds > selectedPropertyMaxExtraBeds
      ) {
        setExtraBeds(0);
      }
    }
  }, [
    selectedProperty,
    selectedPropertyMaxAdults,
    selectedPropertyMaxExtraBeds,
    adults,
    children,
    extraBeds,
  ]);

  useEffect(() => {
    let isActive = true;

    const fetchUnavailableDates = async () => {
      if (propertySelection) {
        setIsLoadingUnavailableDates(true);
        setHasLoadedUnavailableDates(false);
        setCalendarOpen(false);
        setCalendarDates({});

        try {
          const dates = await getUnavailableDatesForProperty(propertySelection);
          if (!isActive) return;

          const mappedDates: DatesData = {};
          dates.forEach((entry) => {
            if (entry.date) {
              mappedDates[entry.date] = { available: false };
            }
          });
          setCalendarDates(mappedDates);
          setHasLoadedUnavailableDates(true);
        } catch (error) {
          if (!isActive) return;
          console.error("Failed to fetch unavailable dates:", error);
          setCalendarDates({});
          setHasLoadedUnavailableDates(true);
        } finally {
          if (isActive) {
            setIsLoadingUnavailableDates(false);
          }
        }
      } else {
        setCalendarOpen(false);
        setIsLoadingUnavailableDates(false);
        setHasLoadedUnavailableDates(false);
        setCalendarDates({});
      }
    };

    fetchUnavailableDates();

    return () => {
      isActive = false;
    };
  }, [propertySelection]);

  useClickOutside(calendarRef, () => {
    if (isCalendarOpen) setCalendarOpen(false);
  });

  useEffect(() => {
    if (state.success) {
      setFeedbackModal({
        isOpen: true,
        title: "Rezerwacja utworzona",
        message: state.message,
      });
      formRef.current?.reset();
      setExtraBeds(0);
      setPaidAmount(0);
      setTotalPrice(0);
      setBookingDates({ start: null, end: null, count: 0 });
      setAdults(2);
      setChildren(0);
      setPropertySelection("");
      setSelectedProperty(null);
      setWantsInvoice(false);
      setInvoiceData({
        companyName: "",
        nip: "",
        street: "",
        postalCode: "",
        city: "",
      });
      setInvoiceErrors({});
    } else if (state.message && !state.success) {
      setFeedbackModal({
        isOpen: true,
        title: "Nie udało się utworzyć rezerwacji",
        message: state.message,
      });
    }
  }, [state]);

  useEffect(() => {
    const { start, end } = bookingDates;
    if (start && end && adults > 0 && propertySelection) {
      const requestId = ++priceRequestIdRef.current;
      startPriceCalculation(async () => {
        const { price } = await calculatePriceAction({
          startDate: start,
          endDate: end,
          baseGuests: adults,
          extraBeds,
          propertySelection,
        });
        if (requestId === priceRequestIdRef.current) {
          setTotalPrice(price);
        }
      });
    }
  }, [bookingDates, adults, extraBeds, propertySelection]);

  const handlePaidAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setPaidAmount(Math.max(0, value));
  };

  const handleInvoiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInvoiceData((prev) => ({ ...prev, [name]: value }));
    if (invoiceErrors[name]) {
      setInvoiceErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateInvoiceData = (): boolean => {
    const errors: Record<string, string> = {};
    if (!invoiceData.companyName.trim()) errors.companyName = "Wymagane";
    if (!invoiceData.nip.trim()) {
      errors.nip = "Wymagane";
    } else if (!/^[\d-]{10,13}$/.test(invoiceData.nip.replace(/-/g, ""))) {
      errors.nip = "Błędny NIP";
    }
    if (!invoiceData.street.trim()) errors.street = "Wymagane";
    if (!invoiceData.postalCode.trim()) {
      errors.postalCode = "Wymagane";
    }
    if (!invoiceData.city.trim()) errors.city = "Wymagane";
    setInvoiceErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetAll = () => {
    formRef.current?.reset();
    setPropertySelection("");
    setSelectedProperty(null);
    setBookingDates({ start: null, end: null, count: 0 });
    setTotalPrice(0);
    setPaidAmount(0);
    setAdults(2);
    setChildren(0);
    setExtraBeds(0);
    setWantsInvoice(false);
    setInvoiceData({
      companyName: "",
      nip: "",
      street: "",
      postalCode: "",
      city: "",
    });
    setInvoiceErrors({});
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!bookingDates.start || !bookingDates.end) {
      e.preventDefault();
      setFeedbackModal({
        isOpen: true,
        title: "Brak terminu",
        message: "Proszę wybrać termin rezerwacji.",
      });
      return;
    }
    if (wantsInvoice && !validateInvoiceData()) {
      e.preventDefault();
      setFeedbackModal({
        isOpen: true,
        title: "Nieprawidłowe dane faktury",
        message: "Proszę poprawnie uzupełnić dane do faktury.",
      });
      return;
    }
  };

  const remainingAmount = totalPrice - paidAmount;
  const getPaymentBadge = () => {
    if (paidAmount >= totalPrice && totalPrice > 0)
      return { text: "Opłacone", class: styles.paymentPaid };
    if (paidAmount > 0)
      return { text: "Zaliczka", class: styles.paymentDeposit };
    return { text: "Nieopłacone", class: styles.paymentUnpaid };
  };
  const paymentBadge = getPaymentBadge();

  const maxAdults = selectedPropertyMaxAdults;
  const maxExtraBedsValue = selectedPropertyMaxExtraBeds;

  const missingLimits =
    selectedProperty &&
    (selectedPropertyMaxAdults == null || selectedPropertyMaxExtraBeds == null);

  return (
    <div className={styles.container}>
      <FloatingBackButton />
      <header className={styles.header}>
        <h1>Dodaj nową rezerwację</h1>
        <p>Ręczne wprowadzenie rezerwacji (np. telefonicznej).</p>
      </header>

      {missingLimits && (
        <div className={styles.warningBox}>
          <span>
            Brak skonfigurowanych limitów gości lub dostawek dla wybranego
            obiektu.
            <br />
            <a
              href="/admin/properties"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.settingsLink}
            >
              Przejdź do ustawień domków
            </a>
          </span>
        </div>
      )}

      <form
        ref={formRef}
        action={formAction}
        onSubmit={handleSubmit}
        className={styles.formCard}
      >
        <input
          type="hidden"
          name="startDate"
          value={bookingDates.start || ""}
        />
        <input type="hidden" name="endDate" value={bookingDates.end || ""} />
        <input type="hidden" name="adults" value={adults} />
        <input type="hidden" name="children" value={children} />
        <input type="hidden" name="extraBedsCount" value={extraBeds} />
        <input type="hidden" name="totalPrice" value={totalPrice} />
        <input type="hidden" name="paidAmount" value={paidAmount} />
        <input
          type="hidden"
          name="invoice"
          value={wantsInvoice ? "true" : "false"}
        />
        <input
          type="hidden"
          name="invoiceCompany"
          value={invoiceData.companyName}
        />
        <input type="hidden" name="invoiceNip" value={invoiceData.nip} />
        <input type="hidden" name="invoiceStreet" value={invoiceData.street} />
        <input
          type="hidden"
          name="invoicePostalCode"
          value={invoiceData.postalCode}
        />
        <input type="hidden" name="invoiceCity" value={invoiceData.city} />

        <div className={styles.sectionTitle}>Termin i Obiekt</div>
        <div className={styles.grid}>
          <div className={styles.inputGroup}>
            <label htmlFor="propertyId">Obiekt</label>
            <select
              id="propertyId"
              name="propertyId"
              required
              disabled={isLoadingProperties}
              onChange={(e) => setPropertySelection(e.target.value)}
              value={propertySelection}
            >
              <option value="">
                {isLoadingProperties ? "Wczytywanie..." : "Wybierz domek"}
              </option>
              {properties.map((prop) => (
                <option key={prop._id} value={prop._id}>
                  {prop.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.dateBox}>
            <label className={styles.label}>Wybierz termin</label>
            <div
              className={`${styles.date} ${!propertySelection || isLoadingUnavailableDates ? styles.dateDisabled : ""}`}
              onClick={() =>
                propertySelection &&
                !isLoadingUnavailableDates &&
                hasLoadedUnavailableDates &&
                setCalendarOpen(!isCalendarOpen)
              }
            >
              <span className={styles.dateText}>
                <span>
                  {bookingDates.start && bookingDates.end
                    ? `${formatDisplayDate(bookingDates.start)} — ${formatDisplayDate(bookingDates.end)}`
                    : !propertySelection
                      ? "Najpierw wybierz obiekt"
                      : isLoadingUnavailableDates
                        ? "Wczytywanie kalendarza..."
                        : "Wybierz daty"}
                </span>
                {isLoadingUnavailableDates && (
                  <span
                    className={styles.inlineSpinner}
                    aria-hidden="true"
                  ></span>
                )}
              </span>
              <span className={styles.dateArrow}>&#9662;</span>
            </div>
            {isCalendarOpen &&
              hasLoadedUnavailableDates &&
              !isLoadingUnavailableDates && (
                <div
                  ref={calendarRef}
                  className={`${styles.setDate} ${isCalendarOpen ? styles.expandedDate : ""}`}
                >
                  <CalendarPicker
                    dates={calendarDates}
                    onDateChange={setBookingDates}
                    minBookingDays={minBookingDays}
                    maxBookingDays={maxBookingDays}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setCalendarOpen(false)}
                  >
                    Gotowe
                  </Button>
                </div>
              )}
          </div>

          <div
            className={`${styles.inputGroup} ${!propertySelection || missingLimits ? styles.disabledGroup : ""}`}
          >
            <label>Dorosłych</label>
            <QuantityPicker
              value={adults}
              onIncrement={() =>
                setAdults((prev) => Math.min(maxAdults ?? 1, prev + 1))
              }
              onDecrement={() => setAdults((prev) => Math.max(1, prev - 1))}
              min={1}
              max={maxAdults ?? 1}
            />
          </div>

          <div
            className={`${styles.inputGroup} ${!propertySelection || missingLimits ? styles.disabledGroup : ""}`}
          >
            <label>Dzieci</label>
            <QuantityPicker
              value={children}
              onIncrement={() => setChildren((prev) => Math.min(10, prev + 1))}
              onDecrement={() => setChildren((prev) => Math.max(0, prev - 1))}
              min={0}
              max={10}
            />
          </div>

          <div
            className={`${styles.inputGroup} ${!propertySelection || missingLimits ? styles.disabledGroup : ""}`}
          >
            <label>Dostawek</label>
            <QuantityPicker
              value={extraBeds}
              onIncrement={() =>
                setExtraBeds((prev) =>
                  Math.min(maxExtraBedsValue ?? 0, prev + 1),
                )
              }
              onDecrement={() => setExtraBeds((prev) => Math.max(0, prev - 1))}
              min={0}
              max={maxExtraBedsValue ?? 0}
            />
          </div>
        </div>

        <div className={styles.sectionTitle}>Płatność</div>
        <div className={styles.grid}>
          <div className={styles.inputGroup}>
            <label htmlFor="totalPrice">Cena całkowita (PLN)</label>
            <div className={styles.priceInputWrapper}>
              <input
                id="totalPrice"
                type="number"
                required
                step="0.01"
                min="0.01"
                value={totalPrice || ""}
                disabled={
                  isCalculating || !propertySelection || !isDateRangeSelected
                }
                onChange={(e) => setTotalPrice(parseFloat(e.target.value) || 0)}
              />
              {isCalculating && <div className={styles.spinner}></div>}
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="paidAmount">Wpłacono (PLN)</label>
            <input
              id="paidAmount"
              type="number"
              step="0.01"
              min="0"
              max={totalPrice}
              value={paidAmount || ""}
              onChange={handlePaidAmountChange}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Do zapłaty</label>
            <div className={styles.remainingAmount}>
              <span className={styles.remainingValue}>
                {remainingAmount.toFixed(2)} zł
              </span>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Status płatności</label>
            <span className={`${styles.badge} ${paymentBadge.class}`}>
              {paymentBadge.text}
            </span>
          </div>
        </div>

        <div className={styles.sectionTitle}>Dodatkowe opcje</div>
        <div className={styles.invoiceOptionGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={wantsInvoice}
              onChange={(e) => setWantsInvoice(e.target.checked)}
            />
            <span>Chcę otrzymać fakturę VAT</span>
          </label>
        </div>

        <div
          className={`${styles.invoiceWrapper} ${wantsInvoice ? styles.expanded : ""}`}
        >
          <div className={styles.invoiceContent}>
            <h3 className={styles.invoiceTitle}>Dane do faktury VAT</h3>
            <div className={styles.inputGroup}>
              <label>Nazwa firmy *</label>
              <input
                name="companyName"
                type="text"
                value={invoiceData.companyName}
                onChange={handleInvoiceChange}
                className={invoiceErrors.companyName ? styles.inputError : ""}
                disabled={!wantsInvoice}
              />
            </div>
            <div className={styles.inputGroup}>
              <label>NIP *</label>
              <input
                name="nip"
                type="text"
                value={invoiceData.nip}
                onChange={handleInvoiceChange}
                className={invoiceErrors.nip ? styles.inputError : ""}
                disabled={!wantsInvoice}
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Ulica i numer *</label>
              <input
                name="street"
                type="text"
                value={invoiceData.street}
                onChange={handleInvoiceChange}
                className={invoiceErrors.street ? styles.inputError : ""}
                disabled={!wantsInvoice}
              />
            </div>
            <div className={styles.grid}>
              <div className={styles.inputGroup}>
                <label>Kod pocztowy *</label>
                <input
                  name="postalCode"
                  type="text"
                  value={invoiceData.postalCode}
                  onChange={handleInvoiceChange}
                  className={invoiceErrors.postalCode ? styles.inputError : ""}
                  maxLength={6}
                  disabled={!wantsInvoice}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Miejscowość *</label>
                <input
                  name="city"
                  type="text"
                  value={invoiceData.city}
                  onChange={handleInvoiceChange}
                  className={invoiceErrors.city ? styles.inputError : ""}
                  disabled={!wantsInvoice}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.sectionTitle}>Dane Gościa</div>
        <div className={styles.grid}>
          <div className={styles.inputGroup}>
            <label htmlFor="guestName">Imię i Nazwisko</label>
            <input id="guestName" name="guestName" type="text" required />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="guestEmail">E-mail</label>
            <input id="guestEmail" name="guestEmail" type="email" required />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="guestPhone">Telefon</label>
            <input id="guestPhone" name="guestPhone" type="tel" required />
          </div>
        </div>

        <div className={styles.inputGroup + " " + styles.internalNotes}>
          <label htmlFor="internalNotes">Uwagi wewnętrzne</label>
          <textarea id="internalNotes" name="internalNotes" rows={3}></textarea>
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={resetAll}>
            Anuluj
          </Button>
          <Button
            type="submit"
            disabled={Boolean(isPending || missingLimits)}
            title={
              missingLimits
                ? "Najpierw skonfiguruj limity gości w ustawieniach domków"
                : undefined
            }
          >
            {isPending ? "Zapisuję..." : "Zapisz rezerwację"}
          </Button>
        </div>
      </form>

      <Modal
        isOpen={feedbackModal.isOpen}
        onClose={() =>
          setFeedbackModal({
            isOpen: false,
            title: "",
            message: "",
          })
        }
        title={feedbackModal.title}
        cancelText="Zamknij"
      >
        <p>{feedbackModal.message}</p>
      </Modal>
    </div>
  );
}
