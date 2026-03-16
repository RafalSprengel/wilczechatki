'use client'
import { useEffect, useState, useMemo } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/pl'
import isBetween from 'dayjs/plugin/isBetween'
import { getCalendarData, CalendarDay, BookingDetails } from '@/actions/getCalendarData'
import { getAllProperties } from '@/actions/adminPropertyActions'
import styles from './page.module.css'
import FloatingBackButton from '@/app/_components/FloatingBackButton/FloatingBackButton'

dayjs.extend(isBetween)
dayjs.locale('pl')

const MONTH_NAMES = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
]

const STATUS_MAP = {
  booked: { label: 'Zajęty', class: styles.booked },
  blocked_sys: { label: 'Zabl.', class: styles.blockedSys },
  free: { label: 'Wolny', class: styles.free }
}

const BookingTooltip = ({ details }: { details: BookingDetails }) => {
  if (!details) return null

  const isPaid = details.paidAmount >= details.totalPrice && details.totalPrice > 0
  const isDeposit = details.paidAmount > 0 && !isPaid
  
  const paymentClass = isPaid ? styles.paymentPaid : isDeposit ? styles.paymentDeposit : styles.paymentUnpaid
  const paymentLabel = isPaid ? 'Opłacone' : isDeposit ? 'Zaliczka' : 'Nieopłacone'

  const extraBedsText = details.extraBeds && details.extraBeds > 0
    ? `${details.extraBeds} dostawka${details.extraBeds === 1 ? '' : 'i'}`
    : 'brak dostawek'

  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipHeader}>
        <h4 className={styles.guestNameText}>{details.guestName}</h4>
        <span className={styles.badge}>{details.status === 'confirmed' ? 'POTWIERDZONA' : 'ZABLOKOWANA'}</span>
      </div>
      
      <div className={styles.tooltipRow}>
        <span className={styles.label}>🗓️ Termin:</span>
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
        <span className={`${styles.valueText} ${paymentClass}`}>{paymentLabel}</span>
      </div>
      
      <div className={styles.tooltipRow}>
        <span className={styles.label}>💰 Cena:</span>
        <span className={`${styles.valueText} ${styles.priceValue}`}>{details.totalPrice.toFixed(2)} PLN</span>
      </div>
      
      <div className={styles.tooltipSection}>
        <div className={styles.tooltipRow}>
          <span className={styles.label}>📧 Email:</span>
          <a href={`mailto:${details.guestEmail}`} className={`${styles.valueText} ${styles.clickableLink}`}>
            {details.guestEmail}
          </a>
        </div>
        <div className={styles.tooltipRow}>
          <span className={styles.label}>📞 Telefon:</span>
          <a href={`tel:${details.guestPhone}`} className={`${styles.valueText} ${styles.clickableLink}`}>
            {details.guestPhone}
          </a>
        </div>
      </div>
    </div>
  )
}

export default function Calendar() {
  const [data, setData] = useState<CalendarDay[]>([])
  const [cabinNames, setCabinNames] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState(dayjs().startOf('month'))

  const years = useMemo(() => Array.from({ length: 5 }, (_, i) => dayjs().year() - 1 + i), [])

  useEffect(() => {
    const loadProperties = async () => {
      try {
        const props = await getAllProperties()
        setCabinNames(props.filter(p => p.type === 'single').map(p => ({ id: p._id, name: p.name })))
      } catch (err) {
        console.error('Błąd pobierania domków:', err)
      }
    }
    loadProperties()
  }, [])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const daysInMonth = currentView.daysInMonth()
        const startDateStr = currentView.format('YYYY-MM-DD')
        const calendarData = await getCalendarData(daysInMonth, startDateStr)
        setData(calendarData)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [currentView])

  const changeMonth = (offset: number) => setCurrentView(prev => prev.add(offset, 'month'))

  return (
    <div className={styles.container}>
      <FloatingBackButton />
      
      <div className={styles.headerControls}>
        <button onClick={() => changeMonth(-1)} className={styles.navButton}>&#8249;</button>
        <select value={currentView.month()} onChange={e => setCurrentView(currentView.month(Number(e.target.value)))} className={styles.selectInput}>
          {MONTH_NAMES.map((name, i) => <option key={name} value={i}>{name}</option>)}
        </select>
        <select value={currentView.year()} onChange={e => setCurrentView(currentView.year(Number(e.target.value)))} className={styles.selectInput}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button onClick={() => changeMonth(1)} className={styles.navButton}>&#8250;</button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.calendarTable}>
          <thead>
            <tr>
              <th className={styles.stickyCol}>Data</th>
              {cabinNames.map(c => <th key={c.id}>{c.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {!loading && data.map((row, index) => {
              const date = dayjs(row.date)
              const isPast = date.isBefore(dayjs(), 'day')
              const isWeekend = [0, 6].includes(date.day())
              const uniqueKey = `${row.date}-${index}`

              return (
                <tr key={uniqueKey} className={isPast ? styles.pastRow : ''}>
                  <td className={`${styles.stickyCol} ${styles.dateCell} ${isWeekend ? styles.weekendCell : ''}`}>
                    <div className={styles.dateContent}>
                      <span className={styles.dateDay}>{row.datePL}</span>
                      <span className={styles.dateWeekday}>({date.format('dd')})</span>
                    </div>
                  </td>
                  {cabinNames.map(cabin => {
                    const cellData = row.cabins[cabin.id]
                    const status = cellData?.status || 'free'
                    const { label, class: statusClass } = STATUS_MAP[status as keyof typeof STATUS_MAP]
                    const hasDetails = (status === 'booked' || status === 'blocked_sys') && cellData?.details

                    return (
                      <td key={cabin.id} className={`${styles.cell} ${statusClass} ${isPast ? styles.pastFree : ''}`}>
                        <span className={styles.statusText}>{label}</span>
                        {hasDetails && (
                          <div className={styles.tooltipContainer}>
                            <BookingTooltip details={cellData.details!} />
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
        {loading && <div className={styles.loadingOverlay}>Ładowanie...</div>}
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