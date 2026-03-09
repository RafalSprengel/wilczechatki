'use client'
import { useEffect, useState } from 'react'
import { getCalendarData, CalendarDay, BookingDetails } from '@/actions/getCalendarData'
import styles from './page.module.css'
import FloatingBackButton from '@/app/_components/FloatingBackButton/FloatingBackButton'

const WEEK_DAY_NAMES = {
  pl: ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
}
const CURRENT_LANG = 'pl'
const MONTH_NAMES = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
]

type PaymentStatus = 'unpaid' | 'deposit' | 'paid'

const getPaymentStatus = (totalPrice: number, paidAmount: number): PaymentStatus => {
  if (paidAmount >= totalPrice && totalPrice > 0) return 'paid'
  if (paidAmount > 0) return 'deposit'
  return 'unpaid'
}

const getPaymentStatusLabel = (status: PaymentStatus): string => {
  switch (status) {
    case 'paid': return 'Opłacone'
    case 'deposit': return 'Zaliczka'
    case 'unpaid': return 'Nieopłacone'
    default: return 'Nieznany'
  }
}

const getPaymentStatusClass = (status: PaymentStatus): string => {
  switch (status) {
    case 'paid': return styles.paymentPaid
    case 'deposit': return styles.paymentDeposit
    case 'unpaid': return styles.paymentUnpaid
    default: return ''
  }
}

const BookingTooltip = ({ details }: { details: BookingDetails }) => {
  if (!details) return null

  const extraBedsText = details.extraBeds && details.extraBeds > 0
    ? `${details.extraBeds} dostawka${details.extraBeds === 1 ? '' : 'i'}`
    : 'brak dostawek'

  const paymentStatus = getPaymentStatus(details.totalPrice, details.paidAmount)
  const paymentStatusText = getPaymentStatusLabel(paymentStatus)
  const paymentStatusClass = getPaymentStatusClass(paymentStatus)

  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipHeader}>
        <h4 className={styles.guestNameText}>{details.guestName}</h4>
        <span className={styles.badge}>{details.status === 'confirmed' ? 'Potwierdzona' : 'Zablokowana'}</span>
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.label}>📅 Termin:</span>
        <span className={styles.valueText}>
          {details.startDate} do {details.endDate} <br />
          <small>({details.durationDays} dni)</small>
        </span>
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.label}>👥 Goście:</span>
        <span className={styles.valueText}>{details.numberOfGuests} osób</span>
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.label}>🛏️ Dostawki:</span>
        <span className={styles.valueText}>{extraBedsText}</span>
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.label}>💳 Płatność:</span>
        <span className={`${styles.valueText} ${paymentStatusClass}`}>{paymentStatusText}</span>
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.label}>💰 Cena:</span>
        <span className={`${styles.valueText} ${styles.priceValue}`}>{details.totalPrice.toFixed(2)} PLN</span>
      </div>
      <div className={styles.tooltipSection}>
        <div className={styles.tooltipRow}>
          <span className={styles.label}>📧 Email:</span>
          <a href={`mailto:${details.guestEmail}`} className={`${styles.valueText} ${styles.contactValue} ${styles.clickableLink}`}>
            {details.guestEmail}
          </a>
        </div>
        <div className={styles.tooltipRow}>
          <span className={styles.label}>📞 Telefon:</span>
          <a href={`tel:${details.guestPhone}`} className={`${styles.valueText} ${styles.contactValue} ${styles.clickableLink}`}>
            {details.guestPhone}
          </a>
        </div>
      </div>
    </div>
  )
}

export default function Calendar() {
  const [data, setData] = useState<CalendarDay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const currentDate = new Date()
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth())

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
        const startDate = new Date(selectedYear, selectedMonth, 1)
        const startDateStr = startDate.toISOString().split('T')[0]
        const calendarData = await getCalendarData(daysInMonth, startDateStr)
        setData(calendarData)
      } catch (err) {
        console.error(err)
        setError('Nie udało się załadować kalendarza.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [selectedYear, selectedMonth])

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 2 + i)

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11)
      setSelectedYear(selectedYear - 1)
    } else {
      setSelectedMonth(selectedMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0)
      setSelectedYear(selectedYear + 1)
    } else {
      setSelectedMonth(selectedMonth + 1)
    }
  }

  const isPastDate = (dateStr: string): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkDate = new Date(dateStr + 'T00:00:00')
    return checkDate < today
  }

  if (error) return <div className={styles.container}>{error}</div>

  const cabinIds = data.length > 0 ? Object.keys(data[0].cabins) : []

  const getDayInfo = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    const dayIndex = date.getDay()
    const dayName = WEEK_DAY_NAMES[CURRENT_LANG][dayIndex]
    let dayClass = ''
    if (dayIndex === 0 || dayIndex === 6) {
      dayClass = styles.weekendCell
    }
    return { dayName, dayClass, dayIndex }
  }

  return (
    <div className={styles.container}>
      <FloatingBackButton />
      <div className={styles.headerControls}>
        <button onClick={handlePrevMonth} className={styles.navButton} title="Poprzedni miesiąc">&#8249;</button>
        <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className={styles.selectInput} aria-label="Wybierz miesiąc" disabled={loading}>
          {MONTH_NAMES.map((name, index) => (<option key={name} value={index}>{name}</option>))}
        </select>
        <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className={styles.selectInput} aria-label="Wybierz rok" disabled={loading}>
          {years.map((year) => (<option key={year} value={year}>{year}</option>))}
        </select>
        <button onClick={handleNextMonth} className={styles.navButton} title="Następny miesiąc">&#8250;</button>
      </div>
      <div className={styles.tableWrapper}>
        <table className={styles.calendarTable}>
          <thead>
            <tr>
              <th className={styles.stickyCol}>Data</th>
              {cabinIds.map((id) => (<th key={id}>Domek</th>))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr key="loading"><td colSpan={cabinIds.length + 1} className={styles.loadingCell}>Ładowanie...</td></tr>
            ) : data.length === 0 ? (
              <tr key="empty"><td colSpan={cabinIds.length + 1} className={styles.emptyCell}>Brak danych do wyświetlenia.</td></tr>
            ) : (
              data.map((row, rowIndex) => {
                const { dayName, dayClass } = getDayInfo(row.date)
                const past = isPastDate(row.date)
                const rowClass = past ? styles.pastRow : ''
                const rowKey = `${row.date}-${rowIndex}`

                return (
                  <tr key={rowKey} className={rowClass}>
                    <td className={`${styles.stickyCol} ${styles.dateCell} ${dayClass} ${past ? styles.pastDate : ''}`}>
                      <div className={styles.dateContent}>
                        <span className={styles.dateDay}>{row.datePL}</span>
                        <span className={styles.dateWeekday}>({dayName})</span>
                      </div>
                    </td>
                    {cabinIds.map((id, cellIndex) => {
                      const cellData = row.cabins[id]
                      const cellKey = `${row.date}-${id}-${cellIndex}`

                      if (!cellData) {
                        return (
                          <td key={cellKey} className={`${styles.cell} ${styles.free} ${past ? styles.pastFree : ''}`}>
                            <span className={styles.statusText}>Wolny</span>
                          </td>
                        )
                      }

                      const hasDetails = cellData.status === 'booked' || cellData.status === 'blocked_sys'
                      let statusText = ''
                      let cellClass = styles.cell

                      switch (cellData.status) {
                        case 'booked':
                          statusText = 'Zajęty'
                          cellClass += ` ${styles.booked} ${past ? styles.pastBooked : ''}`
                          break
                        case 'blocked_sys':
                          statusText = 'Zabl.'
                          cellClass += ` ${styles.blockedSys} ${past ? styles.pastBlocked : ''}`
                          break
                        default:
                          statusText = 'Wolny'
                          cellClass += ` ${styles.free} ${past ? styles.pastFree : ''}`
                      }

                      return (
                        <td key={cellKey} className={cellClass} style={{ position: hasDetails ? 'relative' : 'static' }}>
                          <span className={styles.statusText}>{statusText}</span>
                          {hasDetails && cellData.details && (
                            <div className={styles.tooltipContainer}>
                              <BookingTooltip details={cellData.details} />
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      {!loading && data.length > 0 && (
        <div className={styles.legend}>
          <span><span className={`${styles.dot} ${styles.bookedDot}`}></span> Zajęty</span>
          <span><span className={`${styles.dot} ${styles.blockedSysDot}`}></span> Zabl. (Auto)</span>
          <span><span className={`${styles.dot} ${styles.freeDot}`}></span> Wolny</span>
        </div>
      )}
    </div>
  )
}