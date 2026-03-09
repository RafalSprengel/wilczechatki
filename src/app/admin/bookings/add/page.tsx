'use client';
import { useEffect, useRef, useState } from 'react';
import { useActionState } from 'react'; // Zmiana z useFormState na useActionState
import styles from './page.module.css';
import { createManualBooking } from '@/actions/adminBookingActions';
import FloatingBackButton from '@/app/_components/FloatingBackButton/FloatingBackButton';

const initialState = {
  message: '',
  success: false,
};

function SubmitButton() {
  const { pending } = useActionState(); // useFormStatus nadal działa tak samo
  return (
    <button type="submit" className={styles.btnSubmit} disabled={pending}>
      {pending ? 'Zapisuję...' : 'Zapisz Rezerwację'}
    </button>
  );
}

export default function AddBookingPage() {
  const [state, formAction] = useActionState(createManualBooking, initialState); // useActionState zamiast useFormState
  const formRef = useRef<HTMLFormElement>(null);
  const [extraBeds, setExtraBeds] = useState(0);

  useEffect(() => {
    if (state.success) {
      alert(state.message);
      formRef.current?.reset();
      setExtraBeds(0);
    }
    if (!state.success && state.message) {
      alert(`Błąd: ${state.message}`);
    }
  }, [state]);

  const handleExtraBedsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setExtraBeds(Math.min(4, Math.max(0, value)));
  };

  return (
    <div className={styles.container}>
      <FloatingBackButton />
      <header className={styles.header}>
        <h1>Dodaj Nową Rezerwację</h1>
        <p>Ręczne wprowadzenie rezerwacji (np. telefonicznej)</p>
      </header>
      {state?.message && !state.success && (
        <div className={styles.errorBox}>{state.message}</div>
      )}
      <form ref={formRef} action={formAction} className={styles.formCard}>
        <div className={styles.sectionTitle}>Termin i Obiekt</div>
        <div className={styles.grid}>
          <div className={styles.inputGroup}>
            <label htmlFor="startDate">Data przyjazdu</label>
            <input id="startDate" type="date" required name="startDate" />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="endDate">Data wyjazdu</label>
            <input id="endDate" type="date" required name="endDate" />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="propertyId">Obiekt</label>
            <select id="propertyId" name="propertyId" required>
              <option value="">Wybierz domek</option>
              <option value="cabin1">Chatka A (Wilcza)</option>
              <option value="cabin2">Chatka B (Leśna)</option>
              <option value="both">Cała posesja</option>
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="numGuests">Liczba gości</label>
            <input id="numGuests" name="numGuests" type="number" min="1" max="12" defaultValue="2" />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="extraBeds">Liczba dostawek</label>
            <input 
              id="extraBeds" 
              name="extraBeds" 
              type="number" 
              min="0" 
              max="4" 
              value={extraBeds}
              onChange={handleExtraBedsChange}
              placeholder="0-4"
            />
            <small className={styles.hint}>Maksymalnie 4 dostawki (2 na domek przy całej posesji)</small>
          </div>
        </div>
        
        <div className={styles.sectionTitle}>Status płatności</div>
        <div className={styles.grid}>
          <div className={styles.inputGroup}>
            <label htmlFor="paymentStatus">Status płatności</label>
            <select id="paymentStatus" name="paymentStatus" required defaultValue="unpaid">
              <option value="unpaid">Nieopłacone</option>
              <option value="deposit">Zaliczka wpłacona</option>
              <option value="paid">Opłacone w całości</option>
            </select>
            <small className={styles.hint}>
              {`'Nieopłacone' - gość zapłaci na miejscu, 'Zaliczka' - wpłacona część, 'Opłacone' - całość zapłacona`}
            </small>
          </div>
        </div>

        <div className={styles.sectionTitle}>Dane Gościa</div>
        <div className={styles.grid}>
          <div className={styles.inputGroup}>
            <label htmlFor="guestName">Imię i Nazwisko</label>
            <input id="guestName" name="guestName" type="text" required placeholder="np. Jan Kowalski" />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="guestEmail">Email</label>
            <input id="guestEmail" name="guestEmail" type="email" required placeholder="jan@example.com" />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="guestPhone">Telefon</label>
            <input id="guestPhone" name="guestPhone" type="tel" required placeholder="+48 123 456 789" />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="totalPrice">Cena całkowita (PLN)</label>
            <input id="totalPrice" name="totalPrice" type="number" required placeholder="0.00" step="0.01" />
          </div>
        </div>
        
        <div className={styles.inputGroup}>
          <label htmlFor="internalNotes">Uwagi wewnętrzne</label>
          <textarea id="internalNotes" name="internalNotes" rows={3} placeholder="Np. Gość prosi o łóżeczko dla dziecka"></textarea>
        </div>
        
        <div className={styles.actions}>
          <button type="button" className={styles.btnCancel} onClick={() => {
            formRef.current?.reset();
            setExtraBeds(0);
          }}>Anuluj</button>
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}