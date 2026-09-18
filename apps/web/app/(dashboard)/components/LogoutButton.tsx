'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { LogOut } from 'lucide-react'
import logout from '@/app/actions/logout'

export function LogoutButton() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
        aria-haspopup="dialog"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Log out</span>
      </button>

      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Log out"
            className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setOpen(false)
            }}
          >
            <div className="card w-full max-w-xs p-5">
              <p className="text-sm font-semibold text-ink">Log out of PulseKit?</p>
              <p className="mt-1 text-xs leading-5 text-ink-3">
                You&apos;ll need to sign in again to manage your projects.
              </p>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-1.5 text-sm text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
                >
                  Cancel
                </button>
                <form action={logout}>
                  <button
                    type="submit"
                    className="rounded-lg bg-primary-action px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-action-hover"
                  >
                    Log out
                  </button>
                </form>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}