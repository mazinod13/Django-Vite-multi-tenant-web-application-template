import { useEffect, useState } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type Tenant = {
  id: string
  name: string
  slug: string
  plan: string
  primary_domain: string | null
}

// The public schema has no users, so the platform-admin API is gated by a
// shared secret (see IsPlatformAdmin). Set it once from the browser console:
//   localStorage.setItem('platform_token', '<PLATFORM_ADMIN_TOKEN from .env>')
// In dev with no token configured the API is open and this header is ignored.
function adminHeaders(extra: HeadersInit = {}): HeadersInit {
  const token = localStorage.getItem('platform_token')
  return token ? { ...extra, 'X-Platform-Token': token } : extra
}

export default function App() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [domain, setDomain] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function load() {
    fetch('/api/tenants/', { headers: adminHeaders() })
      .then((r) => (r.ok ? r.json() : []))
      .then(setTenants)
  }
  useEffect(() => { load() }, [])

  function resetForm() {
    setEditingId(null)
    setName(''); setSlug(''); setDomain(''); setError('')
  }

  function startEdit(t: Tenant) {
    setEditingId(t.id)
    setName(t.name)
    setSlug(t.slug)
    setDomain(t.primary_domain ?? '')
    setError('')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    const editing = editingId !== null
    const res = await fetch(editing ? `/api/tenants/${editingId}/` : '/api/tenants/', {
      method: editing ? 'PATCH' : 'POST',
      headers: adminHeaders({ 'Content-Type': 'application/json' }),
      // slug can't change on edit (it's the live schema name)
      body: JSON.stringify(editing ? { name, domain } : { name, slug, domain }),
    })
    setLoading(false)
    if (res.ok) {
      resetForm()
      load()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(Object.values(data).flat().join(' ') || 'Save failed')
    }
  }

  async function remove(id: string) {
    await fetch(`/api/tenants/${id}/`, { method: 'DELETE', headers: adminHeaders() })
    if (editingId === id) resetForm()
    load()
  }

  const port = window.location.port ? `:${window.location.port}` : ''

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="mb-6 text-3xl font-heading">Platform Admin</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit tenant' : 'Create a tenant'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-3">
              <Input placeholder="Name (e.g. Bella Pasta)" value={name} onChange={(e) => setName(e.target.value)} />
              <Input
                placeholder="Slug / schema (e.g. bellapasta)"
                value={slug}
                disabled={!!editingId}   // can't rename a live schema
                onChange={(e) => setSlug(e.target.value)}
              />
              <Input placeholder="Domain (e.g. bellapasta.localhost)" value={domain} onChange={(e) => setDomain(e.target.value)} />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Saving...' : editingId ? 'Update tenant' : 'Create tenant'}
                </Button>
                {editingId && (
                  <Button type="button" variant="neutral" onClick={resetForm}>Cancel</Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Tenants</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {tenants.length === 0 && (
              <p className="text-sm text-muted-foreground">No tenants yet.</p>
            )}
            {tenants.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-base border-2 border-border p-3"
              >
                <div>
                  <p className="font-heading">{t.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {t.slug} &middot; {t.plan} &middot; {t.primary_domain ?? 'no domain'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {t.primary_domain && (
                    <Button
                      variant="neutral"
                      onClick={() => { window.location.href = `http://${t.primary_domain}${port}/` }}
                    >
                      Visit
                    </Button>
                  )}
                  <Button variant="neutral" onClick={() => startEdit(t)}>Edit</Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button>Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {t.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Removes the tenant and its domain, so the restaurant can no longer
                          be reached. The database schema itself is left in place -- drop it
                          by hand with DROP SCHEMA "{t.slug}" CASCADE once you're sure.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove(t.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
