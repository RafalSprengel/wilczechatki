"use client";

import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  createBlockedBookingByAdmin,
  deleteBlockedBookingByAdmin,
  getBlockedBookings,
  getUnavailableDatesForBlocking,
} from "@/actions/adminBookingActions";
import { getAllProperties } from "@/actions/adminPropertyActions";
import Button from "@/app/_components/UI/Button/Button";
import CalendarPicker, {
  type DatesData,
} from "@/app/_components/CalendarPicker/CalendarPicker";
import FloatingBackButton from "@/app/_components/FloatingBackButton/FloatingBackButton";
import Modal from "@/app/_components/Modal/Modal";
import { formatDisplayDate } from "@/utils/formatDate";
import styles from "./page.module.css";

interface PropertyOption {
  _id: string;
  name: string;
}

interface BookingDates {
  start: string | null;
  end: string | null;
  count: number;
}

interface BlockedItem {
  _id: string;
  propertyId: string;
  propertyName: string;
  startDate: string;
  endDate: string;
  adminNotes: string;
  createdAt: string;
}

const ALL_PROPERTIES_ID = "ALL_PROPERTIES";

export default function BlockBookingsPage() {
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [bookingDates, setBookingDates] = useState<BookingDates>({
    start: null,
    end: null,
    count: 0,
  });
  const [calendarDates, setCalendarDates] = useState<DatesData>({});
  const [blockedBookings, setBlockedBookings] = useState<BlockedItem[]>([]);
  const [adminNotes, setAdminNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUnavailable, setIsLoadingUnavailable] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BlockedItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadBlockedBookings = useCallback(async (propertyId?: string) => {
    try {
      const rows = await getBlockedBookings(propertyId);
      setBlockedBookings(rows);
    } catch (error: any) {
      setErrorMessage(error?.message ?? "Nie udało się pobrać listy blokad.");
    }
  }, []);

  const loadUnavailable = useCallback(async (propertyId: string) => {
    setIsLoadingUnavailable(true);
    try {
      const dates = await getUnavailableDatesForBlocking(propertyId);
      const mapped: DatesData = {};
      dates.forEach((entry) => {
        if (entry.date) {
          mapped[entry.date] = { available: false };
        }
      });
      setCalendarDates(mapped);
    } catch (error: any) {
      setErrorMessage(
        error?.message ?? "Nie udało się pobrać zajętych terminów.",
      );
    } finally {
      setIsLoadingUnavailable(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const props = await getAllProperties();
        setProperties(props.map((p) => ({ _id: p._id, name: p.name })));
        await loadBlockedBookings();
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [loadBlockedBookings]);

  useEffect(() => {
    setBookingDates({ start: null, end: null, count: 0 });
    setErrorMessage(null);

    if (!selectedPropertyId) {
      setCalendarDates({});
      loadBlockedBookings();
      return;
    }

    loadUnavailable(selectedPropertyId);
    if (selectedPropertyId === ALL_PROPERTIES_ID) {
      loadBlockedBookings();
    } else {
      loadBlockedBookings(selectedPropertyId);
    }
  }, [selectedPropertyId, loadBlockedBookings, loadUnavailable]);

  const handleCreateBlock = async () => {
    if (!selectedPropertyId || !bookingDates.start) {
      const message = "Wybierz domek i co najmniej dzień rozpoczęcia blokady.";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    const normalizedEndDate =
      bookingDates.end &&
      dayjs(bookingDates.end).isAfter(dayjs(bookingDates.start), "day")
        ? bookingDates.end
        : dayjs(bookingDates.start).add(1, "day").format("YYYY-MM-DD");

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await createBlockedBookingByAdmin({
        propertyId: selectedPropertyId,
        startDate: bookingDates.start,
        endDate: normalizedEndDate,
        adminNotes,
      });

      if (result.success) {
        toast.success(result.message);
        setBookingDates({ start: null, end: null, count: 0 });
        setAdminNotes("");
        await loadUnavailable(selectedPropertyId);
        if (selectedPropertyId === ALL_PROPERTIES_ID) {
          await loadBlockedBookings();
        } else {
          await loadBlockedBookings(selectedPropertyId);
        }
      } else {
        toast.error(result.message);
        setErrorMessage(result.message);
      }
    } catch (error: any) {
      const message =
        error?.message ?? "Nie udało się utworzyć blokady terminu.";
      toast.error(message);
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBlock = async (id: string) => {
    setIsDeletingId(id);
    setErrorMessage(null);

    try {
      const result = await deleteBlockedBookingByAdmin(id);
      if (result.success) {
        setDeleteTarget(null);
        toast.success(result.message);
        if (selectedPropertyId) {
          await loadUnavailable(selectedPropertyId);
        }
        if (selectedPropertyId && selectedPropertyId !== ALL_PROPERTIES_ID) {
          await loadBlockedBookings(selectedPropertyId);
        } else {
          await loadBlockedBookings();
        }
      } else {
        toast.error(result.message);
        setErrorMessage(result.message);
      }
    } catch (error: any) {
      const message = error?.message ?? "Nie udało się usunąć blokady.";
      toast.error(message);
      setErrorMessage(message);
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className={styles.blockPageContainer}>
      <div className={styles.headerRow}>
        <FloatingBackButton />
        <div>
          <h1 className={styles.pageTitle}>Blokuj terminy</h1>
          <p className={styles.pageSubtitle}>
            Twórz blokady administracyjne dla jednego domku lub wszystkich
            domków.
          </p>
        </div>
      </div>

      <form
        className={styles.card}
        onSubmit={(e) => {
          e.preventDefault();
          void handleCreateBlock();
        }}
      >
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Nowa blokada</h2>
          <span className={styles.cardBadge}>Admin</span>
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingContent}>
            <label className={styles.settingLabel} htmlFor="propertySelect">
              Domek
            </label>
            <p className={styles.settingDescription}>
              Wybierz domek z listy lub opcję "Wszystkie".
            </p>
          </div>
          <div className={styles.settingControl}>
            <select
              id="propertySelect"
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className={styles.selectInput}
              disabled={isLoading || isSubmitting}
            >
              <option value="">-- Wybierz domek --</option>
              {properties.map((property) => (
                <option key={property._id} value={property._id}>
                  {property.name}
                </option>
              ))}
              <option value={ALL_PROPERTIES_ID}>Wszystkie</option>
            </select>
          </div>
        </div>

        {selectedPropertyId && (
          <div className={styles.settingRow}>
            <div className={styles.settingContent}>
              <label className={styles.settingLabel}>Zakres blokady</label>
              <p className={styles.settingDescription}>
                Wybierz dzień lub zakres blokady w kalendarzu.
              </p>
            </div>
            <div className={styles.settingControl}>
              {isLoadingUnavailable ? (
                <div className={styles.loadingHint}>
                  Wczytywanie zajętych terminów...
                </div>
              ) : (
                <CalendarPicker
                  dates={calendarDates}
                  onDateChange={setBookingDates}
                  minBookingDays={0}
                />
              )}
              <div className={styles.rangePreview}>
                <strong>Wybrany zakres:</strong>{" "}
                {bookingDates.start && bookingDates.end
                  ? `${formatDisplayDate(bookingDates.start)} -> ${formatDisplayDate(bookingDates.end)}`
                  : bookingDates.start
                    ? `${formatDisplayDate(bookingDates.start)} (1 dzień)`
                    : "brak"}
              </div>
            </div>
          </div>
        )}

        {selectedPropertyId && (
          <div className={styles.settingRow}>
            <div className={styles.settingContent}>
              <label className={styles.settingLabel} htmlFor="adminNotes">
                Notatka (opcjonalnie)
              </label>
              <p className={styles.settingDescription}>
                Ta notatka nie będzie widoczna dla klientów, będzie widoczna
                tylko w panelu admina.
              </p>
            </div>
            <div className={styles.settingControl}>
              <textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className={styles.notesInput}
                placeholder="np. serwis techniczny"
                disabled={isSubmitting}
              />
            </div>
          </div>
        )}

        <div className={styles.actionsRow}>
          <Button
            type="button"
            variant='secondary'
            onClick={() => void handleCreateBlock()}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Zapisywanie..." : "Zablokuj termin"}
          </Button>
        </div>

        {errorMessage && <div className={styles.errorMsg}>{errorMessage}</div>}
      </form>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Istniejące blokady</h2>
          <span className={styles.cardBadge}>{blockedBookings.length}</span>
        </div>

        {blockedBookings.length === 0 ? (
          <div className={styles.emptyState}>
            Brak blokad dla wybranego filtra.
          </div>
        ) : (
          <div className={styles.blockList}>
            {blockedBookings.map((item) => (
              <article key={item._id} className={styles.blockItem}>
                <div className={styles.blockMeta}>
                  <strong>{item.propertyName}</strong>
                  <span>
                    {new Date(item.startDate).toLocaleDateString("pl-PL")} -{" "}
                    {new Date(item.endDate).toLocaleDateString("pl-PL")}
                  </span>
                  {item.adminNotes && <small>{item.adminNotes}</small>}
                </div>
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => setDeleteTarget(item)}
                  disabled={isDeletingId === item._id}
                >
                  {isDeletingId === item._id ? "Usuwanie..." : "Usuń blokadę"}
                </Button>
              </article>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={
          deleteTarget ? () => handleDeleteBlock(deleteTarget._id) : undefined
        }
        title="Potwierdź usunięcie"
        confirmText="Tak, usuń"
        loadingText="Usuwanie..."
        cancelText="Anuluj"
        confirmVariant="danger"
        isLoading={Boolean(deleteTarget && isDeletingId === deleteTarget._id)}
      >
        <p>Czy na pewno chcesz usunąć tę blokadę?</p>
      </Modal>
    </div>
  );
}
