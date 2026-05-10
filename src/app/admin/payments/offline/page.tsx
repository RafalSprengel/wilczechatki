import FloatingBackButton from '@/app/_components/FloatingBackButton/FloatingBackButton'
import { getAdminPaymentsData } from '@/actions/adminPaymentActions'
import PaymentsPanel from '../PaymentsPanel'
import styles from '../page.module.css'

export default async function AdminPaymentsOfflinePage() {
  const paymentsData = await getAdminPaymentsData()

  return (
    <div className={styles['payments-layout']}>
      <header className={styles['payments-layout__header']}>
        <div className={styles['payments-layout__header-top']}>
          <FloatingBackButton />
          <h1 className={styles['payments-layout__title']}>Płatności gotówką lub przelewem</h1>
        </div>
        <p className={styles['payments-layout__subtitle']}>Przeglądaj płatności zrealizowane gotówką lub przelewem.</p>
      </header>

      <PaymentsPanel initialData={paymentsData} mode="offline" />
    </div>
  )
}
