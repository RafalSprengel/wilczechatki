'use client'

import { useState, useEffect } from 'react'
import { authClient } from '@/lib/auth-client'
import { toast } from 'react-hot-toast'

export default function AdminAccountSettings() {
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [currentPassword, setCurrentPassword] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [currentPasswordError, setCurrentPasswordError] = useState<string>('')
  const [newPasswordError, setNewPasswordError] = useState<string>('')

  useEffect(() => {
    if (session?.user) {
      const user = session.user as any
      const u = user.displayUsername !== undefined && user.displayUsername !== null
        ? user.displayUsername
        : user.username

      if (u !== undefined && u !== null) {
        setUsername(u)
      } else {
        throw new Error('Błąd integralności danych: Profil użytkownika nie posiada nazwy użytkownika.')
      }
    }
  }, [session])

  if (sessionPending || username === null) {
    return (
      <section className="settings-card account-settings-card">
        <div className="card-header">
          <h2 className="card-title">Dane Administratora</h2>
        </div>
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading...</p>
        </div>
      </section>
    )
  }

  if (!session?.user) {
    throw new Error('Brak aktywnej sesji administratora.')
  }

  const user = session.user as any
  const dbDisplayUsername = user.displayUsername !== undefined && user.displayUsername !== null
    ? user.displayUsername
    : user.username

  const hasChanges = (username !== dbDisplayUsername && username.length > 0) || password.length > 0
  const passwordsMatch = password === confirmPassword
  const canSave = hasChanges && currentPassword.length > 0 && (password.length > 0 ? passwordsMatch : true)

  const handleSave = async () => {
    if (!hasChanges) return
    setIsSaving(true)

    try {
      if (username !== dbDisplayUsername) {
        if (username.length === 0) {
          toast.error('Login nie może być pusty.')
          return
        }

        const { error: userError } = await (authClient as any).username.updateUsername({
          newUsername: username,
        })
        if (userError) {
          toast.error(userError.message)
          return
        }

        const { error: updateError } = await authClient.updateUser({
          displayUsername: username,
        })
        if (updateError) {
          toast.error(updateError.message)
          return
        }
      }

      if (password.length > 0) {
        if (!passwordsMatch) {
          return // Blokowane przez disabled na przycisku, ale dla pewności zostawiamy early return
        }

        const { error: passwordError } = await authClient.changePassword({
          newPassword: password,
          currentPassword: currentPassword,
        })

        if (passwordError) {
          const msg = passwordError.message?.toLowerCase() || ''
          if (msg.includes('invalid password') || msg.includes('incorrect') || msg.includes('wrong') || msg.includes('current password')) {
            setCurrentPasswordError('Aktualne hasło jest nieprawidłowe.')
          } else if (msg.includes('character') || msg.includes('short') || msg.includes('length')) {
            setNewPasswordError('Nowe hasło musi mieć co najmniej 5 znaków.')
          } else {
            setNewPasswordError(passwordError.message || 'Wystąpił błąd podczas zmiany hasła.')
          }
          return
        }
      }

      toast.success('Dane administratora zostały pomyślnie zaktualizowane.')
      setIsEditing(false)
      setPassword('')
      setConfirmPassword('')
      setCurrentPassword('')
      setCurrentPasswordError('')
      setNewPasswordError('')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Wystąpił nieoczekiwany błąd podczas zapisywania zmian.'
      console.error('Błąd podczas aktualizacji danych admina:', error)
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleEdit = () => {
    if (isEditing) {
      const user = session.user as any
      const u = user.displayUsername !== undefined && user.displayUsername !== null
        ? user.displayUsername
        : user.username

      if (u !== undefined && u !== null) {
        setUsername(u)
      }
      setPassword('')
      setConfirmPassword('')
      setCurrentPassword('')
      setCurrentPasswordError('')
      setNewPasswordError('')
    }
    setIsEditing(!isEditing)
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
              className={`account-input ${currentPasswordError ? 'input-error' : ''}`}
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value)
                setCurrentPasswordError('')
              }}
              placeholder="Wpisz aktualne hasło"
            />
            {currentPasswordError && (
              <span style={{ color: 'var(--color-danger)', fontSize: '0.8rem' }}>{currentPasswordError}</span>
            )}
          </div>
        )}

        <div className="account-input-group">
          <label htmlFor="admin-password">{isEditing ? 'Nowe hasło:' : 'Hasło:'}</label>
          <input
            id="admin-password"
            type="password"
            className={`account-input ${newPasswordError ? 'input-error' : ''} ${password.length > 0 && confirmPassword.length > 0 && !passwordsMatch ? 'input-error' : ''}`}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setNewPasswordError('')
            }}
            disabled={!isEditing}
            placeholder={isEditing ? 'Wpisz nowe hasło' : '••••••••'}
          />
          {newPasswordError && (
            <span style={{ color: 'var(--color-danger)', fontSize: '0.8rem' }}>{newPasswordError}</span>
          )}
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
