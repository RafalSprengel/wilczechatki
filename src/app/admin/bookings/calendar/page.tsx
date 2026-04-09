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

const BookingTooltip = ({ details }: { details: BookingDetails }) => {
  if (!details) return null
  const isPaid = details.paidAmount >= details.totalPrice && details.totalPrice > 0
  const isDeposit = details.paidAmount > 0 && !isPaid
  const paymentClass = isPaid ? styles.paymentPaid : isDeposit ? styles.paymentDeposit : styles.paymentUnpaid
  const paymentLabel = isPaid ? 'Opłacone' : isDeposit ? 'Zaliczka' : 'Nieopłacone'
  const extraBedsText = details.extraBeds && details.extraBeds > 0 ? `${details.extraBeds} dostawka` : 'brak dostawek'

  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipHeader}>
        <h4 className={styles.guestNameText}>{details.guestName}</h4>
        <span className={styles.badge}>{details.status === 'confirmed' ? 'POTWIERDZONA' : 'ZABLOKOWANA'}</span>
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.label}>🗓️ Termin:</span>
        <span className={styles.valueText}>{details.startDate} do {details.endDate}</span>
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
          <span className={styles.valueText}>{details.guestEmail}</span>
        </div>
        <div className={styles.tooltipRow}>
          <span className={styles.label}>📞 Tel:</span>
          <span className={styles.valueText}>{details.guestPhone}</span>
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
      const props = await getAllProperties()
      setCabinNames(props.map(p => ({ id: p._id, name: p.name })))
    }
    loadProperties()
  }, [])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      const calendarData = await getCalendarData(currentView.daysInMonth(), currentView.format('YYYY-MM-DD'))
      setData(calendarData)
      setLoading(false)
    }
    loadData()
  }, [currentView])

  return (
    <div className={styles.container}>
      <FloatingBackButton />
      <div className={styles.headerControls}>
        <button onClick={() => setCurrentView(prev => prev.subtract(1, 'month'))} className={styles.navButton}>&#8249;</button>
        <select value={currentView.month()} onChange={e => setCurrentView(currentView.month(Number(e.target.value)))} className={styles.selectInput}>
          {MONTH_NAMES.map((name, i) => <option key={name} value={i}>{name}</option>)}
        </select>
        <select value={currentView.year()} onChange={e => setCurrentView(currentView.year(Number(e.target.value)))} className={styles.selectInput}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button onClick={() => setCurrentView(prev => prev.add(1, 'month'))} className={styles.navButton}>&#8250;</button>
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
            {!loading && data.map((row) => {
              const date = dayjs(row.date)
              const isPast = date.isBefore(dayjs(), 'day')
              return (
                <tr key={row.date} className={isPast ? styles.pastRow : ''}>
                  <td className={`${styles.stickyCol} ${styles.dateCell} ${[0, 6].includes(date.day()) ? styles.weekendCell : ''}`}>
                    <div className={styles.dateContent}>
                      <span className={styles.dateDay}>{row.datePL}</span>
                      <span className={styles.dateWeekday}>({date.format('dd')})</span>
                    </div>
                  </td>
                  {cabinNames.map(cabin => {
                    const cell = row.cabins[cabin.id]
                    if (!cell || cell.status === 'free') {
                      return <td key={cabin.id} className={styles.free}><span className={styles.statusText}>Wolny</span></td>
                    }
                    
                    if (cell.status === 'booked' || cell.status === 'blocked_sys') {
                      return (
                        <td key={cabin.id} className={styles.cell} style={{ backgroundColor: isPast ? '#f5f5f5' : cell.details?.color }}>
                          <span className={styles.statusText}>{cell.status === 'booked' ? 'Zajęty' : 'Zabl.'}</span>
                          <div className={styles.tooltipContainer}><BookingTooltip details={cell.details!} /></div>
                        </td>
                      )
                    }

                    return (
                      <td key={cabin.id} className={styles.splitCellContainer}>
                        <div className={styles.splitWrapper}>
                          <div 
                            className={`${styles.half} ${cell.checkoutDetails ? styles.bookedHalf : styles.freeHalf}`}
                            style={{ backgroundColor: (!isPast && cell.checkoutDetails) ? cell.checkoutDetails.color : '' }}
                          >
                            <span className={styles.halfText}>{cell.checkoutDetails ? 'OUT' : 'Wolny'}</span>
                            {cell.checkoutDetails && <div className={styles.tooltipContainer}><BookingTooltip details={cell.checkoutDetails} /></div>}
                          </div>
                          <div 
                            className={`${styles.half} ${cell.checkinDetails ? styles.bookedHalf : styles.freeHalf}`}
                            style={{ backgroundColor: (!isPast && cell.checkinDetails) ? cell.checkinDetails.color : '' }}
                          >
                            <span className={styles.halfText}>{cell.checkinDetails ? 'IN' : 'Wolny'}</span>
                            {cell.checkinDetails && <div className={styles.tooltipContainer}><BookingTooltip details={cell.checkinDetails} /></div>}
                          </div>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}