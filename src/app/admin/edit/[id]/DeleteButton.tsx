'use client'

export default function DeleteButton() {
  return (
    <button 
      type="submit"
      className="rounded-lg border border-status-error text-status-error px-4 py-2 hover:bg-status-error/10 transition-colors"
      onClick={(e) => {
        if (!window.confirm('Are you sure you want to permanently delete this item? This action cannot be undone.')) {
          e.preventDefault()
        }
      }}
    >
      Delete Item
    </button>
  )
}
