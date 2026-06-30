import { useEffect, useState } from 'react'

import { fetchMe, logout, type User } from '@/lib/auth'
import AuthPage from '@/components/ui/AuthPage'
import { Button } from '@/components/ui/button'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // ask the backend who we are (uses the stored access token)
  function refresh() {
    return fetchMe().then((u) => {
      setUser(u)
      setLoading(false)
    })
  }

      useEffect(() => {
        refresh()
        const onShow = (e: PageTransitionEvent) => {
        if (e.persisted) {
            // page restored from bfcache: drop the stale UI, then re-verify
            setUser(null)
            setLoading(true)
            refresh()
        }
        }
        window.addEventListener('pageshow', onShow)
        return () => window.removeEventListener('pageshow', onShow)
    }, [])


  if (loading) return <p className="p-8">Loading...</p>
  if (!user) return <AuthPage onAuthenticated={refresh} />   // not logged in -> show login/signup/forgot

  // logged in -> top bar with logout, then the actual dashboard
  return (
    <div>
      <header className="flex items-center justify-between border-b-2 border-border bg-secondary-background p-4">
        <span className="text-sm">
          Signed in as <strong>{user.username}</strong> &middot; {user.tenant}
        </span>
        <Button variant="neutral" onClick={async () => { await logout(); setUser(null) }}>
          Logout
        </Button>
      </header>
      {children}
    </div>
  )
}
