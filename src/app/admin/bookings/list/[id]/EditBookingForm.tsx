'use client';
import { useState } from 'react';
import { updateBookingAction } from '@/actions/adminBookingActions';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';


interface FormData {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  adults: number | '';
  children: number | '';
  extraBedsCount: number | '';
  totalPrice: number | '';
  paidAmount: number | '';
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

  const formatDate = (date: any) => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  };

  const initialValues: FormData = {
    guestName: initialData.guestName ?? initialData.guestInfo?.name ?? '',
    guestEmail: initialData.guestEmail ?? initialData.guestInfo?.email ?? '',
    guestPhone: initialData.guestPhone ?? initialData.guestInfo?.phone ?? '',
    adults: initialData.adults ?? 1,
    children: initialData.children ?? 0,
    extraBedsCount: initialData.extraBedsCount ?? 0,
    totalPrice: initialData.totalPrice ?? 0,
    paidAmount: initialData.paidAmount ?? 0,
    status: initialData.status ?? 'pending',
    startDate: formatDate(initialData.startDate),
    endDate: formatDate(initialData.endDate),
  };

  const orderId = typeof initialData.orderId === 'string' ? initialData.orderId.trim() : '';

  const [form, setForm] = useState<FormData>(initialValues);
  const [originalData, setOriginalData] = useState<FormData>(initialValues);

  const hasChanges = () => {
    return JSON.stringify(form) !== JSON.stringify(originalData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (["adults", "children", "extraBedsCount", "totalPrice", "paidAmount"].includes(name)) {
      setForm((prev) => ({
        ...prev,
        [name]: value === "" ? "" : Number(value),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    if (isSaved) setIsSaved(false);
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setForm(originalData);
      setIsSaved(false);
      setMessage(null);
    }
    setIsEditing(!isEditing);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const requiredNumeric = ["adults", "children", "extraBedsCount", "totalPrice", "paidAmount"];
    for (const field of requiredNumeric) {
      const val = form[field as keyof FormData];
      if (val === "" || val === null || Number.isNaN(val)) {
        setMessage({ type: 'error', text: 'Wszystkie pola numeryczne muszą być wypełnione.' });
        setIsSaving(false);
        return;
      }
    }

    const formData = new FormData();
    formData.append('bookingId', initialData._id);
    formData.append('propertyId', initialData.propertyId);
    formData.append('extraBedsCount', String(form.extraBedsCount));
    formData.append('children', String(form.children));
    formData.append('guestName', form.guestName);
    formData.append('guestEmail', form.guestEmail);
    formData.append('guestPhone', form.guestPhone);
    formData.append('adults', String(form.adults));
    formData.append('totalPrice', String(form.totalPrice));
    formData.append('paidAmount', String(form.paidAmount));
    formData.append('status', form.status);
    formData.append('startDate', form.startDate);
    formData.append('endDate', form.endDate);
    formData.append('internalNotes', initialData.internalNotes ?? '');

    const result = await updateBookingAction(null, formData);

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
        <div className={styles.formTitleWrap}>
          <h2 className={styles.formTitle}>Dane rezerwacji</h2>
          <span className={styles.orderIdBadge}>{orderId.length > 0 ? orderId : 'Brak numeru zamówienia'}</span>
        </div>
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
          <label>E-mail</label>
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
          <label>Dorośli</label>
          <input
            name="adults"
            type="number"
            min="1"
            value={form.adults}
            onChange={handleChange}
            readOnly={!isEditing}
            className={!isEditing ? styles.readOnly : ''}
          />
        </div>
        <div className={styles.inputGroup}>
          <label>Dzieci</label>
          <input
            name="children"
            type="number"
            min="0"
            value={form.children}
            onChange={handleChange}
            readOnly={!isEditing}
            className={!isEditing ? styles.readOnly : ''}
          />
        </div>
        <div className={styles.inputGroup}>
          <label>Dostawki</label>
          <input
            name="extraBedsCount"
            type="number"
            min="0"
            value={form.extraBedsCount}
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
          <label>Wpłacona kwota (PLN)</label>
          <input
            name="paidAmount"
            type="number"
            step="0.01"
            value={form.paidAmount}
            onChange={handleChange}
            required
            readOnly={!isEditing}
            className={!isEditing ? styles.readOnly : ''}
          />
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
            <option value="failed">Odrzucona (failed)</option>
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
