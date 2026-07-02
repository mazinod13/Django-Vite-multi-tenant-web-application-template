import { createContext, useContext, useEffect, useState } from 'react'

import { fetchMe, logout as apiLogout, type User } from '@/lib/auth'
import AuthPage from '@/components/ui/AuthPage'

type AuthContextValue = { user: User; logout: () => Promise<void> }

const AuthContext = createContext<AuthContextValue | null>(null)

// Access the logged-in user + logout from any component inside <AuthGate>.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthGate>')
  return ctx
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  function refresh() {
    return fetchMe().then((u) => {
      setUser(u)
      setLoading(false)
    })
  }

  useEffect(() => {
    refresh()
    // re-verify auth if the page is restored from the back/forward cache
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setUser(null)
        setLoading(true)
        refresh()
      }
    }
    window.addEventListener('pageshow', onShow)
    return () => window.removeEventListener('pageshow', onShow)
  }, [])

  if (loading) return <p className="p-8">Loading...</p>
  if (!user) return <AuthPage onAuthenticated={refresh} />

  const logout = async () => {
    await apiLogout()
    setUser(null)
  }

  // NOTE: no wrapping <div>/<header> here — that would fight layouts like the
  // sidebar that expect to own the full-height page. We only provide context.
  return (
    <AuthContext.Provider value={{ user, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
