'use client';
import { useState, useEffect } from 'react';
import { updateBooking } from '@/actions/adminBookingActions';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

interface FormData {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  numberOfGuests: number;
  totalPrice: number;
  paymentStatus: string;
  status: string;
  startDate: string;
  endDate: string;
}

export default function EditBookingForm({ initialData }: { initialData: any }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [originalData, setOriginalData] = useState<FormData | null>(null);

  const formatDate = (date: Date) => new Date(date).toISOString().split('T')[0];

  const [form, setForm] = useState<FormData>({
    guestName: initialData.guestName || '',
    guestEmail: initialData.guestEmail || '',
    guestPhone: initialData.guestPhone || '',
    numberOfGuests: initialData.numberOfGuests || 0,
    totalPrice: initialData.totalPrice || 0,
    paymentStatus: initialData.paymentStatus || 'unpaid',
    status: initialData.status,
    startDate: formatDate(initialData.startDate),
    endDate: formatDate(initialData.endDate),
  });

  useEffect(() => {
    setOriginalData({ ...form });
  }, []);

  const hasChanges = () => {
    if (!originalData) return false;
    return JSON.stringify(form) !== JSON.stringify(originalData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'numberOfGuests' || name === 'totalPrice' ? Number(value) : value,
    }));
    if (isSaved) setIsSaved(false);
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setForm({
        guestName: initialData.guestName || '',
        guestEmail: initialData.guestEmail || '',
        guestPhone: initialData.guestPhone || '',
        numberOfGuests: initialData.numberOfGuests || 0,
        totalPrice: initialData.totalPrice || 0,
        paymentStatus: initialData.paymentStatus || 'unpaid',
        status: initialData.status,
        startDate: formatDate(initialData.startDate),
        endDate: formatDate(initialData.endDate),
      });
      setIsSaved(false);
    }
    setIsEditing(!isEditing);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const result = await updateBooking(initialData._id, form);

    if (result.success) {
      setMessage({ type: 'success', text: 'Zapisano zmiany pomyślnie!' });
      setOriginalData({ ...form });
      setIsSaved(true);
      router.refresh();
    } else {
      setMessage({ type: 'error', text: result.message || 'Wystąpił błąd.' });
    }

    setIsSaving(false);
  };

  const getButtonText = () => {
    if (isSaving) return '⏳ Zapisuję...';
    if (isSaved && !hasChanges()) return '✅ Zapisano';
    return '💾 Zapisz';
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {message && (
        <div className={`${styles.alert} ${message.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
          {message.text}
        </div>
      )}

      <div className={styles.formHeader}>
        <h2 className={styles.formTitle}>Dane rezerwacji</h2>
        <button
          type="button"
          className={`${styles.editToggleBtn} ${isEditing ? styles.editing : ''}`}
          onClick={handleEditToggle}
          disabled={isSaving}
        >
          {isEditing ? '❌ Anuluj' : '✏️ Edytuj'}
        </button>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.inputGroup}>
          <label>Imię i Nazwisko</label>
          <input
            name="guestName"
            value={form.guestName}
            onChange={handleChange}
            required
            readOnly={!isEditing}
            className={!isEditing ? styles.readOnly : ''}
          />
        </div>
        <div className={styles.inputGroup}>
          <label>Email</label>
          <input
            name="guestEmail"
            type="email"
            value={form.guestEmail}
            onChange={handleChange}
            required
            readOnly={!isEditing}
            className={!isEditing ? styles.readOnly : ''}
          />
        </div>
        <div className={styles.inputGroup}>
          <label>Telefon</label>
          <input
            name="guestPhone"
            type="tel"
            value={form.guestPhone}
            onChange={handleChange}
            required
            readOnly={!isEditing}
            className={!isEditing ? styles.readOnly : ''}
          />
        </div>
        <div className={styles.inputGroup}>
          <label>Liczba Gości</label>
          <input
            name="numberOfGuests"
            type="number"
            min="1"
            value={form.numberOfGuests}
            onChange={handleChange}
            readOnly={!isEditing}
            className={!isEditing ? styles.readOnly : ''}
          />
        </div>
        <div className={styles.inputGroup}>
          <label>Data Przyjazdu</label>
          <input
            name="startDate"
            type="date"
            value={form.startDate}
            onChange={handleChange}
            required
            readOnly={!isEditing}
            className={!isEditing ? styles.readOnly : ''}
          />
        </div>
        <div className={styles.inputGroup}>
          <label>Data Wyjazdu</label>
          <input
            name="endDate"
            type="date"
            value={form.endDate}
            onChange={handleChange}
            required
            readOnly={!isEditing}
            className={!isEditing ? styles.readOnly : ''}
          />
        </div>
        <div className={styles.inputGroup}>
          <label>Cena Całkowita (PLN)</label>
          <input
            name="totalPrice"
            type="number"
            step="0.01"
            value={form.totalPrice}
            onChange={handleChange}
            required
            readOnly={!isEditing}
            className={!isEditing ? styles.readOnly : ''}
          />
        </div>
        <div className={styles.inputGroup}>
          <label>Status płatności</label>
          <select
            name="paymentStatus"
            value={form.paymentStatus}
            onChange={handleChange}
            disabled={!isEditing}
            className={!isEditing ? styles.readOnly : ''}
          >
            <option value="unpaid">Nieopłacone</option>
            <option value="deposit">Zaliczka</option>
            <option value="paid">Opłacone</option>
          </select>
        </div>
        <div className={styles.inputGroup}>
          <label>Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            disabled={!isEditing}
            className={!isEditing ? styles.readOnly : ''}
          >
            <option value="pending">Oczekująca</option>
            <option value="confirmed">Potwierdzona</option>
            <option value="blocked">Zablokowana</option>
            <option value="cancelled">Anulowana</option>
          </select>
        </div>
      </div>

      {isEditing && (
        <div className={styles.formActions}>
          <button
            type="submit"
            className={styles.saveBtn}
            disabled={isSaving || (!hasChanges() && isSaved)}
          >
            {getButtonText()}
          </button>
        </div>
      )}
    </form>
  );
}