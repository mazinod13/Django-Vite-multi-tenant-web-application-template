import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { authFetch } from '@/lib/auth'

type TenantUser = {
  id: string
  username: string
  email: string
  phone: string
  role: string | null
  is_active: boolean
}

type Role = {
  id: string
  name: string
}

const items = ['Users', 'Roles'] as const

export default function Administration() {
  const navigate = useNavigate()
  const [activeItem, setActiveItem] = useState<(typeof items)[number]>('Users')
  
  // Data States
  const [users, setUsers] = useState<TenantUser[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // User Form State
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [userRole, setUserRole] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)

  // Role Form State
  const [roleName, setRoleName] = useState('')
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
    loadRoles()
  }, [])

  async function loadUsers() {
    try {
      setLoading(true)
      const res = await authFetch('/users/')
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      } else {
        setError('Failed to load users')
      }
    } catch (err) {
      setError('Connection error loading users')
    } finally {
      setLoading(false)
    }
  }

  async function loadRoles() {
    try {
      const res = await authFetch('/roles/')
      if (res.ok) {
        const data = await res.json()
        setRoles(data)
      }
    } catch (err) {
      console.error('Error loading roles:', err)
    }
  }

  function resetUserForm() {
    setUsername('')
    setEmail('')
    setPhone('')
    setPassword('')
    setUserRole('')
    setIsActive(true)
    setEditingUserId(null)
    setError('')
  }

  function resetRoleForm() {
    setRoleName('')
    setEditingRoleId(null)
    setError('')
  }

  async function submitUser(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!editingUserId && (!username.trim() || !password.trim())) {
      setError('Username and password are required for new users')
      return
    }

    try {
      setLoading(true)
      const body: Record<string, any> = {
        email,
        phone,
        role: userRole === '' ? null : userRole,
        is_active: isActive
      }
      
      // Only include username/password when creating a user
      if (!editingUserId) {
        body.username = username
        body.password = password
      }

      const endpoint = editingUserId ? `/users/${editingUserId}/` : '/register/'
      const method = editingUserId ? 'PATCH' : 'POST'

      const res = await authFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        resetUserForm()
        loadUsers()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(Object.values(data).flat().join(' ') || 'Save failed')
      }
    } catch (err) {
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }

  async function submitRole(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!roleName.trim()) {
      setError('Role name is required')
      return
    }

    try {
      setLoading(true)
      const endpoint = editingRoleId ? `/roles/${editingRoleId}/` : '/roles/'
      const method = editingRoleId ? 'PUT' : 'POST'
      const res = await authFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: roleName })
      })

      if (res.ok) {
        resetRoleForm()
        loadRoles()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(Object.values(data).flat().join(' ') || 'Save role failed')
      }
    } catch (err) {
      setError('Connection error saving role')
    } finally {
      setLoading(false)
    }
  }

  function startEditUser(u: TenantUser) {
    setEditingUserId(u.id)
    setUsername(u.username)
    setEmail(u.email)
    setPhone(u.phone ?? '')
    setUserRole(u.role ?? '')
    setIsActive(u.is_active)
    setError('')
  }

  function startEditRole(r: Role) {
    setEditingRoleId(r.id)
    setRoleName(r.name)
    setError('')
  }

  async function deleteUser(id: string) {
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      const res = await authFetch(`/users/${id}/`, { method: 'DELETE' })
      if (res.ok) {
        if (editingUserId === id) resetUserForm()
        loadUsers()
      } else {
        setError('Failed to delete user')
      }
    } catch (err) {
      setError('Delete request failed')
    }
  }

  async function deleteRole(id: string) {
    if (!confirm('Are you sure you want to delete this role?')) return
    try {
      const res = await authFetch(`/roles/${id}/`, { method: 'DELETE' })
      if (res.ok) {
        if (editingRoleId === id) resetRoleForm()
        loadRoles()
      } else {
        setError('Failed to delete role')
      }
    } catch (err) {
      setError('Delete role failed')
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col gap-8">
        <header className="flex items-start justify-between">
          <div className="w-[160px]" />
          <div className="flex-1 space-y-3 text-center">
            <h1 className="text-4xl font-heading md:text-6xl">Administration</h1>
            <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground">System control hub</p>
          </div>
          <Button variant="neutral" onClick={() => navigate('/')}>
            Back to Dashboard
          </Button>
        </header>

        <div className="flex flex-wrap justify-center gap-3">
          {items.map((item) => (
            <Button
              key={item}
              variant={activeItem === item ? 'default' : 'neutral'}
              onClick={() => setActiveItem(item)}
            >
              {item}
            </Button>
          ))}
        </div>

        {error && <p className="text-center text-sm text-red-600 font-medium">{error}</p>}

        <div className="grid gap-6 lg:grid-cols-3">
          {activeItem === 'Users' && (
            <>
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>{editingUserId ? 'Edit User' : 'Register User'}</CardTitle>
                  <CardDescription>Manage user credentials, roles, and status.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={submitUser} className="space-y-4">
                    <div>
                      <label className="mb-1 block text-xs font-heading">Username</label>
                      <Input 
                        placeholder="e.g. janesmith" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={!!editingUserId}
                        aria-required="true"
                      />
                    </div>
                    {!editingUserId && (
                      <div>
                        <label className="mb-1 block text-xs font-heading">Password</label>
                        <Input 
                          type="password"
                          placeholder="Password" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          aria-required="true"
                        />
                      </div>
                    )}
                    <div>
                      <label className="mb-1 block text-xs font-heading">Email Address</label>
                      <Input 
                        type="email"
                        placeholder="e.g. jane@school.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-heading">Phone Number</label>
                      <Input 
                        placeholder="e.g. +1 555 1234" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-heading">Role Assignment</label>
                      <select
                        className="w-full rounded-base border-2 border-border bg-secondary-background p-2.5 text-sm font-base text-foreground focus:outline-hidden focus:ring-2 focus:ring-black"
                        value={userRole}
                        onChange={(e) => setUserRole(e.target.value)}
                      >
                        <option value="">No role assigned</option>
                        {roles.map((r) => (
                          <option key={r.id} value={r.name}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                    {editingUserId && (
                      <div className="flex items-center gap-2 py-2">
                        <input 
                          type="checkbox" 
                          id="is_active_chk" 
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                          className="h-4 w-4 rounded-base border-2 border-border"
                        />
                        <label htmlFor="is_active_chk" className="text-sm font-base">Account is active</label>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Saving...' : editingUserId ? 'Update User' : 'Register User'}
                      </Button>
                      {editingUserId && (
                        <Button type="button" variant="neutral" onClick={resetUserForm}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>User Accounts</CardTitle>
                  <CardDescription>View, edit, and suspend tenant workspace accounts.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {users.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No users registered.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-base border-2 border-border">
                      <table className="w-full border-collapse text-left" role="grid">
                        <thead className="bg-secondary-background">
                          <tr className="border-b-2 border-border">
                            <th className="px-4 py-3 text-sm font-heading">Username</th>
                            <th className="px-4 py-3 text-sm font-heading">Email</th>
                            <th className="px-4 py-3 text-sm font-heading">Role</th>
                            <th className="px-4 py-3 text-sm font-heading">Status</th>
                            <th className="px-4 py-3 text-sm font-heading text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((u) => (
                            <tr key={u.id} className="border-b border-border hover:bg-secondary-background/20">
                              <td className="px-4 py-3 text-sm font-heading">{u.username}</td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">{u.email || 'N/A'}</td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">{u.role || 'Unassigned'}</td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`inline-block rounded-base px-2 py-0.5 text-xs font-heading border-2 border-border ${
                                  u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {u.is_active ? 'Active' : 'Suspended'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-right space-x-2">
                                <Button size="sm" variant="neutral" onClick={() => startEditUser(u)}>Edit</Button>
                                <Button size="sm" onClick={() => deleteUser(u.id)}>Delete</Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {activeItem === 'Roles' && (
            <>
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>{editingRoleId ? 'Edit Role' : 'Create Role'}</CardTitle>
                  <CardDescription>Define system permission scopes.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={submitRole} className="space-y-4">
                    <div>
                      <label className="mb-1 block text-xs font-heading">Role Name</label>
                      <Input 
                        placeholder="e.g. Teacher" 
                        value={roleName}
                        onChange={(e) => setRoleName(e.target.value)}
                        aria-required="true"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Saving...' : editingRoleId ? 'Update' : 'Create'}
                      </Button>
                      {editingRoleId && (
                        <Button type="button" variant="neutral" onClick={resetRoleForm}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>System Roles</CardTitle>
                  <CardDescription>Available roles and access groups.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {roles.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No custom roles defined.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-base border-2 border-border">
                      <table className="w-full border-collapse text-left" role="grid">
                        <thead className="bg-secondary-background">
                          <tr className="border-b-2 border-border">
                            <th className="px-4 py-3 text-sm font-heading">Role Name</th>
                            <th className="px-4 py-3 text-sm font-heading text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {roles.map((r) => (
                            <tr key={r.id} className="border-b border-border hover:bg-secondary-background/20">
                              <td className="px-4 py-3 text-sm font-heading">{r.name}</td>
                              <td className="px-4 py-3 text-sm text-right space-x-2">
                                <Button size="sm" variant="neutral" onClick={() => startEditRole(r)}>Edit</Button>
                                <Button size="sm" onClick={() => deleteRole(r.id)}>Delete</Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </main>
  )
}

