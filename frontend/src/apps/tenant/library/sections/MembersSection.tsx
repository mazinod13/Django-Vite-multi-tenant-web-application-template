import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authFetch } from '@/lib/auth'

type TenantUser = {
  id: string
  username: string
  email: string
  role: string | null
  is_active: boolean
}

export default function MembersSection() {
  const [users, setUsers] = useState<TenantUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    try {
      setLoading(true)
      const res = await authFetch('/users/')
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      } else {
        setError('Failed to load library members')
      }
    } catch (err) {
      setError('Connection error loading users')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Library Members</CardTitle>
        <CardDescription>Accounts authorized to borrow materials within this workspace.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

        {loading && users.length === 0 ? (
          <p className="text-sm text-muted-foreground">Loading member list...</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-muted-foreground">No registered accounts found in the schema.</p>
        ) : (
          <div className="overflow-x-auto rounded-base border-2 border-border">
            <table className="w-full border-collapse text-left" role="grid">
              <thead className="bg-secondary-background">
                <tr className="border-b-2 border-border">
                  <th className="px-4 py-3 text-sm font-heading">Username</th>
                  <th className="px-4 py-3 text-sm font-heading">Email Address</th>
                  <th className="px-4 py-3 text-sm font-heading">Assigned Role</th>
                  <th className="px-4 py-3 text-sm font-heading">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border hover:bg-secondary-background/20">
                    <td className="px-4 py-3 text-sm font-heading">{u.username}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{u.email || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{u.role || 'Unassigned'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-block rounded-base px-2 py-0.5 text-xs font-heading border-2 border-border ${
                          u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {u.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
