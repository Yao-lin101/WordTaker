import { useState, useEffect } from 'react'
import './index.css'

let addToast

export function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    addToast = (message) => {
      const id = Date.now()
      setToasts(prev => [...prev, { id, message }])
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id))
      }, 3000)
    }
  }, [])

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className="toast">
          {toast.message}
        </div>
      ))}
    </div>
  )
}

export function toast(message) {
  addToast?.(message)
} 