'use client'

export default function DeleteButton() {
  return (
    <button 
      type="submit"
      className="rounded-lg border border-status-error text-status-error px-4 py-2 hover:bg-status-error/10 transition-colors"
      onClick={(e) => {
        if (!window.confirm('确定永久删除这条库存？删除后无法恢复。')) {
          e.preventDefault()
        }
      }}
    >
      删除库存
    </button>
  )
}
