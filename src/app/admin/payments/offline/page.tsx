import FloatingBackButton from '@/app/_components/FloatingBackButton/FloatingBackButton'
import { getAdminPaymentsData } from '@/actions/adminPaymentActions'
import PaymentsPanel from '../PaymentsPanel'
import styles from '../page.module.css'

export default async function AdminPaymentsOfflinePage() {
  const paymentsData = await getAdminPaymentsData()

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <FloatingBackButton />
          <h1>Płatności</h1>
        </div>
        <p>Zarządzaj płatnościami online oraz wpłatami gotówką i przelewem.</p>
      </header>

      <PaymentsPanel initialData={paymentsData} mode="offline" />
    </div>
  )
}
