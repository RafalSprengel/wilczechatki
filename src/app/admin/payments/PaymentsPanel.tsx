'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import type { AdminPaymentsData, AdminPaymentTab, AdminPaymentStatus } from '@/actions/adminPaymentActions'
import { syncOnlinePaymentAction } from '@/actions/adminPaymentActions'
import styles from './page.module.css'

interface PaymentsPanelProps {
  initialData: AdminPaymentsData
  mode: AdminPaymentTab
}

function formatStatus(status: string): string {
  if (status === 'confirmed') {
    return 'Potwierdzone'
  }

  if (status === 'failed') {
    return 'Odrzucone (failed)'
  }

  return 'Oczekujące (pending)'
}

function formatMethod(method: 'online' | 'cash' | 'transfer'): string {
  if (method === 'cash') {
    return 'Gotówka'
  }

  if (method === 'transfer') {
    return 'Przelew'
  }

  return 'Online'
}

export default function PaymentsPanel({ initialData, mode }: PaymentsPanelProps) {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<AdminPaymentStatus>('confirmed')
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const rows = mode === 'online' ? initialData.online : initialData.offline

  const filteredRows = useMemo(
    () => (mode === 'online' ? rows.filter((row) => row.status === statusFilter) : rows),
    [rows, statusFilter, mode]
  )

  const onSync = (bookingId: string) => {
    setSyncingId(bookingId)

    startTransition(async () => {
      const result = await syncOnlinePaymentAction(bookingId)

      if (result.level === 'success') {
        toast.success(result.message)
      }

      if (result.level === 'info') {
        toast(result.message)
      }

      if (result.level === 'error') {
        toast.error(result.message)
      }

      setSyncingId(null)
      router.refresh()
    })
  }

  return (
    <section className={styles.panel}>
      <h2 className={styles.sectionTitle}>{mode === 'online' ? 'Płatności Online' : 'Gotówka/Przelew'}</h2>

      {mode === 'online' ? (
        <div className={styles.filters} role="radiogroup" aria-label="Filtr statusu">
          <button
            type="button"
            role="radio"
            aria-checked={statusFilter === 'confirmed'}
            className={`${styles.filterBtn} ${statusFilter === 'confirmed' ? styles.filterBtnActive : ''}`}
            onClick={() => setStatusFilter('confirmed')}
          >
            Potwierdzone
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={statusFilter === 'failed'}
            className={`${styles.filterBtn} ${statusFilter === 'failed' ? styles.filterBtnActive : ''}`}
            onClick={() => setStatusFilter('failed')}
          >
            Odrzucone (failed)
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={statusFilter === 'pending'}
            className={`${styles.filterBtn} ${statusFilter === 'pending' ? styles.filterBtnActive : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            Oczekujące (pending)
          </button>
        </div>
      ) : null}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Data</th>
              <th>Klient</th>
              <th>Kwota</th>
              {mode === 'online' ? <th>Status</th> : <th>Metoda</th>}
              {mode === 'online' ? <th>Sesja Stripe</th> : null}
              {mode === 'online' ? <th>Akcja</th> : null}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={mode === 'online' ? 6 : 4} className={styles.emptyRow}>
                  Brak płatności dla wybranego filtra.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => {
                const createdAt = new Date(row.createdAt)
                const canSync =
                  mode === 'online' &&
                  row.status === 'pending'

                return (
                  <tr key={row.id}>
                    <td>{createdAt.toLocaleString('pl-PL')}</td>
                    <td>{row.guestName}</td>
                    <td>{row.totalPrice.toFixed(2)} zł</td>
                    {mode === 'online' ? <td>{formatStatus(row.status)}</td> : <td>{formatMethod(row.paymentMethod)}</td>}
                    {mode === 'online' ? (
                      <td>
                        {typeof row.stripeSessionId === 'string' && row.stripeSessionId.trim().length > 0 ? (
                          <a
                            href={`https://dashboard.stripe.com/checkout/sessions/${row.stripeSessionId}`}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.sessionLink}
                          >
                            {row.stripeSessionId}
                          </a>
                        ) : (
                          <span className={styles.missingSession}>Brak ID sesji</span>
                        )}
                      </td>
                    ) : null}
                    {mode === 'online' ? (
                      <td>
                        {canSync ? (
                          <button
                            type="button"
                            className={styles.syncBtn}
                            disabled={isPending && syncingId === row.id}
                            onClick={() => onSync(row.id)}
                          >
                            {isPending && syncingId === row.id ? (
                              <span className={styles.syncLoading}>
                                <span className={styles.spinner} aria-hidden="true"></span>
                                Loading...
                              </span>
                            ) : (
                              'Synchronizuj'
                            )}
                          </button>
                        ) : (
                          <span className={styles.noAction}>-</span>
                        )}
                      </td>
                    ) : null}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {mode === 'online' && initialData.stalePendingCount > 0 ? (
        <div className={styles.alertBox}>
          Masz {initialData.stalePendingCount} płatności online oczekujących. Może to wskazywać na problemy z komunikacją Webhook. Zweryfikuj je ręcznie w panelu Stripe.
        </div>
      ) : null}
    </section>
  )
}
