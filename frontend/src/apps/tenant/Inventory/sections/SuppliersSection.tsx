import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { authFetch } from '@/lib/auth'

type Supplier = {
  id: string
  name: string
  contact_name: string
  email: string
  phone: string
  address: string
}

export default function SuppliersSection() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')

  useEffect(() => {
    loadSuppliers()
  }, [])

  async function loadSuppliers() {
    try {
      setLoading(true)
      const res = await authFetch('/suppliers/')
      if (res.ok) {
        const data = await res.json()
        setSuppliers(data)
      } else {
        setError('Failed to load suppliers list')
      }
    } catch (err) {
      setError('Connection error loading suppliers')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setName('')
    setContactName('')
    setEmail('')
    setPhone('')
    setAddress('')
    setEditingId(null)
    setIsEditing(false)
    setError('')
  }

  function startEdit(s: Supplier) {
    setEditingId(s.id)
    setName(s.name)
    setContactName(s.contact_name)
    setEmail(s.email)
    setPhone(s.phone)
    setAddress(s.address)
    setIsEditing(true)
    setError('')
  }

  async function submitSupplier(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Supplier Name is required.')
      return
    }

    try {
      setLoading(true)
      const body = {
        name,
        contact_name: contactName,
        email,
        phone,
        address,
      }

      const endpoint = editingId ? `/suppliers/${editingId}/` : '/suppliers/'
      const method = editingId ? 'PUT' : 'POST'

      const res = await authFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        resetForm()
        loadSuppliers()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(Object.values(data).flat().join(' ') || 'Save failed')
      }
    } catch (err) {
      setError('Server connection error')
    } finally {
      setLoading(false)
    }
  }

  async function deleteSupplier(id: string) {
    if (!confirm('Are you sure you want to remove this supplier?')) return
    try {
      const res = await authFetch(`/suppliers/${id}/`, { method: 'DELETE' })
      if (res.ok) {
        loadSuppliers()
      } else {
        setError('Failed to delete supplier')
      }
    } catch (err) {
      setError('Delete request failed')
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1 h-fit shadow-shadow">
        <CardHeader>
          <CardTitle>{editingId ? 'Edit Supplier' : 'Register Supplier'}</CardTitle>
          <CardDescription>Enter procurement supplier contact credentials.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitSupplier} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-heading">Supplier Name</label>
              <Input
                placeholder="e.g. Apex Industrial Supplies"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-required="true"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-heading">Contact Rep Name</label>
              <Input
                placeholder="e.g. John Doe"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-heading">Email Address</label>
              <Input
                type="email"
                placeholder="e.g. sales@apex.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-heading">Phone Number</label>
              <Input
                placeholder="e.g. +1 555-987-6543"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-heading">Office Address</label>
              <textarea
                className="w-full rounded-base border-2 border-border bg-secondary-background p-2.5 text-sm font-base text-foreground focus:outline-hidden focus:ring-2 focus:ring-black"
                rows={2}
                placeholder="Street address, building, ZIP code..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

            <div className="flex gap-2 pt-2">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Saving...' : editingId ? 'Update Supplier' : 'Register Supplier'}
              </Button>
              {(editingId || isEditing) && (
                <Button type="button" variant="neutral" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 shadow-shadow">
        <CardHeader>
          <CardTitle>Suppliers List</CardTitle>
          <CardDescription>Procurement contacts registered inside the current workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && suppliers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading suppliers list...</p>
          ) : suppliers.length === 0 ? (
            <div className="rounded-base border-2 border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No suppliers registered yet. Add one on the left.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-base border-2 border-border">
              <table className="w-full border-collapse text-left">
                <thead className="bg-secondary-background">
                  <tr className="border-b-2 border-border text-xs">
                    <th className="px-4 py-3 font-heading">Supplier Name</th>
                    <th className="px-4 py-3 font-heading">Contact Rep</th>
                    <th className="px-4 py-3 font-heading">Email / Phone</th>
                    <th className="px-4 py-3 font-heading text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr key={s.id} className="border-b border-border hover:bg-secondary-background/10 text-sm">
                      <td className="px-4 py-3">
                        <div className="font-heading">{s.name}</div>
                        {s.address && <div className="text-xs text-muted-foreground truncate max-w-xs">{s.address}</div>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{s.contact_name || 'N/A'}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div>{s.email || 'N/A'}</div>
                        <div>{s.phone || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                        <Button size="sm" variant="neutral" onClick={() => startEdit(s)}>
                          Edit
                        </Button>
                        <Button size="sm" onClick={() => deleteSupplier(s.id)}>
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
