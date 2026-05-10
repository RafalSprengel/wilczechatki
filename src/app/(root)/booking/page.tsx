import React from 'react'
import { searchAction, getMaxTotalGuests, SearchResults } from '@/actions/searchActions'
import { getBookingConfig } from '@/actions/bookingConfigActions'
import { getBlockedDates } from '@/actions/bookingActions'
import BookingClient from './BookingClient'

interface SearchParams {
  start?: string
  end?: string
  adults?: string
  children?: string
}

export default async function BookingPage({
  searchParams
}: {
  searchParams: SearchParams | Promise<SearchParams>
}) {
  const resolvedSearchParams = await searchParams
  const start = resolvedSearchParams.start || null
  const end = resolvedSearchParams.end || null
  const adults = resolvedSearchParams.adults ? parseInt(resolvedSearchParams.adults, 10) : 2
  const children = resolvedSearchParams.children ? parseInt(resolvedSearchParams.children, 10) : 0

  const totalGuests = adults + children

  const [maxTotalGuests, bookingConfig, blockedDates] = await Promise.all([
    getMaxTotalGuests(),
    getBookingConfig(),
    getBlockedDates()
  ])

  let searchResults: SearchResults | null = null

  if (start && end && totalGuests > 0) {
    try {
      searchResults = await searchAction({
        startDate: start,
        endDate: end,
        baseGuests: totalGuests,
        extraBeds: 0
      })
    } catch (error) {
      console.error(error)
      searchResults = null
    }
  }
  return (
    <>
      <BookingClient
        initialStart={start}
        initialEnd={end}
        initialAdults={adults}
        initialChildren={children}
        maxTotalGuests={maxTotalGuests}
        minBookingDays={bookingConfig.minBookingDays}
        maxBookingDays={bookingConfig.maxBookingDays}
        childrenFreeAgeLimit={bookingConfig.childrenFreeAgeLimit}
        blockedDates={blockedDates}
        searchResults={searchResults}
      />
    </>
  )
}