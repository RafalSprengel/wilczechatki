'use client'

import { useState, useEffect } from 'react'
import { authClient } from '@/lib/auth-client'
import { toast } from 'react-hot-toast'

export default function AdminAccountSettings() {
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const currentUsername = (session?.user as any)?.username || ''
    setUsername(currentUsername)
  }, [session])

  const currentUsername = (session?.user as any)?.username || ''
  const hasChanges = (username !== currentUsername && username.length > 0) || password.length > 0
  const passwordsMatch = password === confirmPassword
  const canSave = hasChanges && currentPassword.length > 0 && (password.length > 0 ? passwordsMatch : true)

  const handleSave = async () => {
    if (!hasChanges) return
    setIsSaving(true)

    try {
      if (username !== currentUsername) {
        const { error: userError } = await (authClient as any).username.updateUsername({
          newUsername: username,
        })
        if (userError) throw new Error(userError.message)
      }

      if (password.length > 0) {
        const { error: passwordError } = await authClient.changePassword({
          newPassword: password,
          currentPassword: currentPassword,
        })
        if (passwordError) throw new Error(passwordError.message)
      }

      toast.success('Dane administratora zostały pomyślnie zaktualizowane.')
      setIsEditing(false)
      setPassword('')
      setConfirmPassword('')
      setCurrentPassword('')
    } catch (error: any) {
      console.error('Błąd podczas aktualizacji danych admina:', error)
      toast.error(error.message || 'Wystąpił błąd podczas zapisywania zmian.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleEdit = () => {
    if (isEditing) {
      setUsername((session?.user as any)?.username || '')
      setPassword('')
      setConfirmPassword('')
      setCurrentPassword('')
    }
    setIsEditing(!isEditing)
  }

  if (sessionPending) {
    return (
      <section className="settings-card account-settings-card">
        <div className="card-header">
          <h2 className="card-title">Dane Administratora</h2>
        </div>
        <div className="account-form">
          <p className="loading-spinner">Ładowanie danych sesji...</p>
        </div>
      </section>
    )
  }

  return (
    <section className="settings-card account-settings-card">
      <div className="card-header">
        <h2 className="card-title">Dane Administratora</h2>
        <span className="card-badge">Profil</span>
      </div>

      <div className="account-edit-header">
        <button 
          type="button" 
          className="btn-toggle-edit" 
          onClick={handleToggleEdit}
        >
          {isEditing ? 'Anuluj' : 'Edytuj'}
        </button>
      </div>

      <div className="account-form">
        <div className="account-input-group">
          <label htmlFor="admin-username">Login (Nazwa użytkownika):</label>
          <input
            id="admin-username"
            type="text"
            className="account-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={!isEditing}
            placeholder="Wpisz login"
          />
        </div>

        {isEditing && (
          <div className="account-input-group">
            <label htmlFor="current-password">Aktualne hasło:</label>
            <input
              id="current-password"
              type="password"
              className="account-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Wpisz aktualne hasło"
            />
          </div>
        )}

        <div className="account-input-group">
          <label htmlFor="admin-password">{isEditing ? 'Nowe hasło:' : 'Hasło:'}</label>
          <input
            id="admin-password"
            type="password"
            className={`account-input ${password.length > 0 && confirmPassword.length > 0 && !passwordsMatch ? 'input-error' : ''}`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={!isEditing}
            placeholder={isEditing ? 'Wpisz nowe hasło' : '••••••••'}
          />
        </div>

        {isEditing && (
          <div className="account-input-group">
            <label htmlFor="confirm-password">Powtórz nowe hasło:</label>
            <input
              id="confirm-password"
              type="password"
              className={`account-input ${password.length > 0 && confirmPassword.length > 0 && !passwordsMatch ? 'input-error' : ''}`}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Wpisz nowe hasło ponownie"
            />
            {password.length > 0 && confirmPassword.length > 0 && !passwordsMatch && (
              <span style={{ color: 'var(--color-danger)', fontSize: '0.8rem' }}>Hasła nie są identyczne!</span>
            )}
          </div>
        )}

        {isEditing && (
          <div className="account-actions">
            <button
              type="button"
              className="account-save-btn"
              onClick={handleSave}
              disabled={!canSave || isSaving}
            >
              {isSaving ? 'Zapisywanie...' : 'Zapisz'}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
