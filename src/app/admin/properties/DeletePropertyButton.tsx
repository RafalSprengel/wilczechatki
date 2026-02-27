'use client'
import styles from './page.module.css'

export default function DeletePropertyButton() {
  return (
    <button
      type="submit"
      className={styles.btnDelete}
      onClick={(e) => {
        if (!confirm('Czy na pewno usunąć ten domek?')) e.preventDefault()
      }}
    >
      🗑️ Usuń
    </button>
  )
}