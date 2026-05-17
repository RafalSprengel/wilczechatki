'use client'

import { useState, useEffect } from 'react'
import { getSiteSettings, updateSiteSettings } from '@/actions/siteSettingsActions'
import { toast } from 'react-hot-toast'
import styles from './SiteSettingsForm.module.css'
import settingsStyles from './settings.module.css'

export default function SiteSettingsForm() {
  const [isEditing, setIsEditing] = useState(false)
  const [settings, setSettings] = useState({
    phoneDisplay: '',
    phoneHref: '',
    email: '',
    facebookUrl: '',
    bankAccountNumber: ''
  })
  const [initialSettings, setInitialSettings] = useState({
    phoneDisplay: '',
    phoneHref: '',
    email: '',
    facebookUrl: '',
    bankAccountNumber: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    async function loadSettings() {
      const data = await getSiteSettings()
      const formattedData = {
        phoneDisplay: data?.phoneDisplay ?? '',
        phoneHref: data?.phoneHref ?? '',
        email: data?.email ?? '',
        facebookUrl: data?.facebookUrl ?? '',
        bankAccountNumber: data?.bankAccountNumber ?? ''
      }
      setSettings(formattedData)
      setInitialSettings(formattedData)
      setIsLoading(false)
    }
    loadSettings()
  }, [])

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(initialSettings)

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (settings.phoneHref.trim() && !/^\+\d{7,15}$/.test(settings.phoneHref.trim())) {
      newErrors.phoneHref = 'Format: +XXXXXXXXXXX (cyfry po +, bez spacji i myślników).'
    }

    if (settings.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email.trim())) {
      newErrors.email = 'Podaj prawidłowy adres e-mail.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!hasChanges) return
    if (!validate()) return
    setIsSaving(true)

    try {
      const result = await updateSiteSettings(settings)
      if (result.success) {
        toast.success(result.message)
        setInitialSettings(settings)
        setIsEditing(false)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('Wystąpił nieoczekiwany błąd.')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleEdit = () => {
    if (isEditing) {
      setSettings(initialSettings)
      setErrors({})
    }
    setIsEditing(!isEditing)
  }



  return (
    <section className={`${settingsStyles.settingsCard} ${styles.siteSettings__card}`}>
      <div className={settingsStyles.cardHeader}>
        <h2 className={settingsStyles.cardTitle}>Dane Firmy / Obiektu</h2>
        <span className={settingsStyles.cardBadge}>Globalne</span>
        <div><p>Dane te są wyświetlane na stronie jako informacja dla odwiedzających</p></div>
      </div>

      <div className={styles.siteSettings__editHeader}>
        <button
          type="button"
          className={styles.siteSettings__toggleEdit}
          onClick={handleToggleEdit}
        >
          {isEditing ? 'Anuluj' : 'Edytuj'}
        </button>
      </div>

      <div className={styles.siteSettings__form}>
        {isLoading ? (
          <div className={settingsStyles.loadingContainer}>
            <div className={settingsStyles.spinner}></div>
            <p className={settingsStyles.loadingText}>Loading...</p>
          </div>
        ) : (
          <>
            <div className={styles.siteSettings__inputGroup}>
              <label htmlFor="site-phone-display">Telefon:</label>
              <input
                id="site-phone-display"
                type="text"
                className={styles.siteSettings__input}
                value={settings.phoneDisplay}
                onChange={(e) => setSettings({ ...settings, phoneDisplay: e.target.value })}
                disabled={!isEditing}
                placeholder="+48 000 000 000"
              />
            </div>

            <div className={styles.siteSettings__inputGroup}>
              <label htmlFor="site-phone-href">Telefon w formacie: +XXXXXXXXXXX, bez spacji i myślników, np. +48123456789:</label>
              <input
                id="site-phone-href"
                type="text"
                className={`${styles.siteSettings__input}${errors.phoneHref ? ` ${styles['siteSettings__input--error']}` : ''}`}
                value={settings.phoneHref}
                onChange={(e) => { setSettings({ ...settings, phoneHref: e.target.value }); if (errors.phoneHref) setErrors({ ...errors, phoneHref: '' }) }}
                disabled={!isEditing}
                placeholder="+48000000000"
              />
              {errors.phoneHref && <span className={styles.siteSettings__fieldError}>{errors.phoneHref}</span>}
            </div>

            <div className={styles.siteSettings__inputGroup}>
              <label htmlFor="site-email">E-mail kontaktowy:</label>
              <input
                id="site-email"
                type="email"
                className={`${styles.siteSettings__input}${errors.email ? ` ${styles['siteSettings__input--error']}` : ''}`}
                value={settings.email}
                onChange={(e) => { setSettings({ ...settings, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: '' }) }}
                disabled={!isEditing}
                placeholder="kontakt@example.com"
              />
              {errors.email && <span className={styles.siteSettings__fieldError}>{errors.email}</span>}
            </div>

            <div className={styles.siteSettings__inputGroup}>
              <label htmlFor="site-facebook">Facebook URL:</label>
              <input
                id="site-facebook"
                type="text"
                className={styles.siteSettings__input}
                value={settings.facebookUrl}
                onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
                disabled={!isEditing}
                placeholder="https://facebook.com/..."
              />
            </div>

            <div className={styles.siteSettings__inputGroup}>
              <label htmlFor="site-bank-account">Numer konta bankowego:</label>
              <input
                id="site-bank-account"
                type="text"
                className={styles.siteSettings__input}
                value={settings.bankAccountNumber}
                onChange={(e) => setSettings({ ...settings, bankAccountNumber: e.target.value })}
                disabled={!isEditing}
                placeholder="00 0000 0000 0000 0000 0000 0000"
              />
            </div>

            {isEditing && (
              <div className={styles.siteSettings__actions}>
                <button
                  type="button"
                  className={styles.siteSettings__saveBtn}
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                >
                  {isSaving ? 'Zapisywanie...' : 'Zapisz'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
