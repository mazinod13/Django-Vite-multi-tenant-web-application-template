import { useState } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function ResetPasswordPage() {
  const params = new URLSearchParams(window.location.search)
  const uid = params.get('uid') ?? ''
  const token = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    const res = await fetch('/api/password-reset/confirm/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, token, new_password: password }),
    })
    setLoading(false)
    if (res.ok) { setDone(true); return }
    const data = await res.json().catch(() => ({}))
    setError(Object.values(data).flat().join(' ') || 'Reset failed.')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader><CardTitle className="text-xl">Reset password</CardTitle></CardHeader>
        <CardContent>
          {done ? (
            <div className="space-y-3">
              <p className="text-sm">Password updated. You can now log in.</p>
              <Button className="w-full" onClick={() => { window.location.href = '/' }}>
                Go to login
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <Input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '...' : 'Set new password'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
