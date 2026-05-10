'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import styles from './BookingSearch.module.css'

interface BookingSearchProps {
  defaultValue: string
}

export default function BookingSearch({ defaultValue }: BookingSearchProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(defaultValue)

  useEffect(() => {
    const currentQ = searchParams.get('q') || ''
    if (query.trim() === currentQ.trim()) return

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      const trimmed = query.trim()

      if (trimmed) {
        params.set('q', trimmed)
      } else {
        params.delete('q')
      }

      const queryString = params.toString()
      const finalUrl = queryString ? `${pathname}?${queryString}` : pathname

      router.replace(finalUrl, { scroll: false })
    }, 400)

    return () => clearTimeout(timer)
  }, [query, pathname, router, searchParams])

  return (
    <div className={styles.bookingSearch}>
      <input
        type="text"
        placeholder="Szukaj po nazwisku, e-mailu lub numerze"
        className={styles.bookingSearchInput}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </div>
  )
}
