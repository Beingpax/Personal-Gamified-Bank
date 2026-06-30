import { Cloud, LogOut, RefreshCw, RotateCcw, Send } from 'lucide-react'
import type { Screen, SyncStatus } from '../../app/types'

export function TopBar({
  activeScreen,
  authEmail,
  authMessage,
  isSupabaseConfigured,
  onReset,
  pendingChangeCount,
  sessionEmail,
  setAuthEmail,
  signInWithEmail,
  signOut,
  syncNow,
  syncStatus,
}: {
  activeScreen: Screen
  authEmail: string
  authMessage: string
  isSupabaseConfigured: boolean
  onReset: () => void
  pendingChangeCount: number
  sessionEmail?: string
  setAuthEmail: (value: string) => void
  signInWithEmail: () => Promise<void>
  signOut: () => Promise<void>
  syncNow: () => Promise<void>
  syncStatus: SyncStatus
}) {
  return (
    <header className="topbar">
      <div className="topbar-actions">
        <div className="sync-panel">
          <div className="sync-status">
            <Cloud aria-hidden="true" size={15} />
            <span>{getSyncLabel(syncStatus, pendingChangeCount)}</span>
          </div>

          {sessionEmail ? (
            <div className="account-row">
              <span title={sessionEmail}>{sessionEmail}</span>
              <button
                aria-label="Sync now"
                className="icon-action"
                onClick={() => void syncNow()}
                type="button"
              >
                <RefreshCw aria-hidden="true" size={15} />
              </button>
              <button
                aria-label="Sign out"
                className="icon-action"
                onClick={() => void signOut()}
                type="button"
              >
                <LogOut aria-hidden="true" size={15} />
              </button>
            </div>
          ) : (
            <form
              className="login-form"
              onSubmit={(event) => {
                event.preventDefault()
                void signInWithEmail()
              }}
            >
              <input
                aria-label="Email address"
                disabled={!isSupabaseConfigured}
                placeholder="you@email.com"
                type="email"
                value={authEmail}
                onChange={(event) => setAuthEmail(event.target.value)}
              />
              <button disabled={!isSupabaseConfigured} type="submit">
                <Send aria-hidden="true" size={15} />
                Sign in
              </button>
            </form>
          )}

          {authMessage && <p className="auth-message">{authMessage}</p>}
        </div>

        {activeScreen === 'targets' && (
          <button
            className="reset-button"
            onClick={onReset}
            title="Reset all data"
            type="button"
          >
            <RotateCcw aria-hidden="true" size={15} />
            Reset
          </button>
        )}
      </div>
    </header>
  )
}

function getSyncLabel(status: SyncStatus, pendingChangeCount: number) {
  if (status === 'loading') return 'Loading'
  if (status === 'syncing') return 'Syncing'
  if (status === 'synced') return 'Synced'
  if (status === 'offline') return `${pendingChangeCount} offline`
  if (status === 'error') return `${pendingChangeCount} pending`

  return pendingChangeCount > 0 ? `${pendingChangeCount} local` : 'Local'
}
