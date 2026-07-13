import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { authFetch } from '@/lib/auth'

type Supplier = {
  id: string
  name: string
}

type Product = {
  id: string
  name: string
  sku: string
  description: string
  category: string
  unit_price: number
  quantity_on_hand: number
  reorder_level: number
  supplier: string | null
  supplier_name?: string
}

export default function ProductsSection() {
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('General')
  const [unitPrice, setUnitPrice] = useState('0.00')
  const [reorderLevel, setReorderLevel] = useState('5')
  const [supplierId, setSupplierId] = useState('')

  useEffect(() => {
    loadProducts()
    loadSuppliers()
  }, [])

  async function loadProducts() {
    try {
      setLoading(true)
      const res = await authFetch('/products/')
      if (res.ok) {
        const data = await res.json()
        setProducts(data)
      } else {
        setError('Failed to load products catalog')
      }
    } catch (err) {
      setError('Connection error loading products')
    } finally {
      setLoading(false)
    }
  }

  async function loadSuppliers() {
    try {
      const res = await authFetch('/suppliers/')
      if (res.ok) {
        const data = await res.json()
        setSuppliers(data)
      }
    } catch (err) {
      console.error('Error loading suppliers:', err)
    }
  }

  function resetForm() {
    setName('')
    setSku('')
    setDescription('')
    setCategory('General')
    setUnitPrice('0.00')
    setReorderLevel('5')
    setSupplierId('')
    setEditingId(null)
    setIsEditing(false)
    setError('')
  }

  function startEdit(p: Product) {
    setEditingId(p.id)
    setName(p.name)
    setSku(p.sku)
    setDescription(p.description)
    setCategory(p.category)
    setUnitPrice(p.unit_price.toString())
    setReorderLevel(p.reorder_level.toString())
    setSupplierId(p.supplier ?? '')
    setIsEditing(true)
    setError('')
  }

  async function submitProduct(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim() || !sku.trim()) {
      setError('Product Name and SKU code are required.')
      return
    }

    const price = parseFloat(unitPrice)
    const level = parseInt(reorderLevel)

    if (isNaN(price) || price < 0 || isNaN(level) || level < 0) {
      setError('Unit price and reorder level must be positive numbers.')
      return
    }

    try {
      setLoading(true)
      const body = {
        name,
        sku: sku.trim(),
        description,
        category,
        unit_price: price,
        reorder_level: level,
        supplier: supplierId === '' ? null : supplierId,
      }

      const endpoint = editingId ? `/products/${editingId}/` : '/products/'
      const method = editingId ? 'PUT' : 'POST'

      const res = await authFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        resetForm()
        loadProducts()
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

  async function deleteProduct(id: string) {
    if (!confirm('Are you sure you want to remove this product from the inventory catalog?')) return
    try {
      const res = await authFetch(`/products/${id}/`, { method: 'DELETE' })
      if (res.ok) {
        loadProducts()
      } else {
        setError('Failed to delete product')
      }
    } catch (err) {
      setError('Delete request failed')
    }
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.supplier_name && p.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1 h-fit shadow-shadow">
        <CardHeader>
          <CardTitle>{editingId ? 'Edit Product Details' : 'Add New Product'}</CardTitle>
          <CardDescription>Enter catalog specification details for the stock item.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitProduct} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-heading">Product Name</label>
              <Input
                placeholder="e.g. Copper Wire Coil"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-required="true"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-heading">SKU Code</label>
              <Input
                placeholder="e.g. COP-WIRE-20"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                disabled={!!editingId}
                aria-required="true"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-heading">Category</label>
              <Input
                placeholder="e.g. Electronics / Raw Material"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-heading">Unit Price ($)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                aria-required="true"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-heading">Reorder Level (Alert threshold)</label>
              <Input
                type="number"
                min="0"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value)}
                aria-required="true"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-heading">Supplier</label>
              <select
                className="w-full rounded-base border-2 border-border bg-secondary-background p-2.5 text-sm font-base text-foreground focus:outline-hidden focus:ring-2 focus:ring-black"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
              >
                <option value="">Select product supplier...</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-heading">Description / Details</label>
              <textarea
                className="w-full rounded-base border-2 border-border bg-secondary-background p-2.5 text-sm font-base text-foreground focus:outline-hidden focus:ring-2 focus:ring-black"
                rows={2}
                placeholder="Product specs, notes, shelf location..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

            <div className="flex gap-2 pt-2">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Saving...' : editingId ? 'Update Specs' : 'Register Product'}
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
          <CardTitle>Inventory Catalog</CardTitle>
          <CardDescription>Search and filter active products, quantities, prices, and suppliers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search by name, SKU, category, or supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button variant="neutral" onClick={() => setSearchQuery('')}>
                Clear
              </Button>
            )}
          </div>

          {loading && products.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading inventory list...</p>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-base border-2 border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No products found matching search query.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-base border-2 border-border">
              <table className="w-full border-collapse text-left">
                <thead className="bg-secondary-background">
                  <tr className="border-b-2 border-border text-xs">
                    <th className="px-4 py-3 font-heading">Product SKU</th>
                    <th className="px-4 py-3 font-heading">Product Name</th>
                    <th className="px-4 py-3 font-heading">Unit Price</th>
                    <th className="px-4 py-3 font-heading">Stock Status</th>
                    <th className="px-4 py-3 font-heading text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => {
                    const isLow = p.quantity_on_hand <= p.reorder_level && p.quantity_on_hand > 0
                    const isOut = p.quantity_on_hand === 0
                    return (
                      <tr key={p.id} className="border-b border-border hover:bg-secondary-background/10 text-sm">
                        <td className="px-4 py-3 font-mono font-heading">{p.sku}</td>
                        <td className="px-4 py-3">
                          <div className="font-heading">{p.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {p.category} &middot; {p.supplier_name ?? 'No Supplier'}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-muted-foreground">
                          ${parseFloat(p.unit_price.toString()).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-base px-2 py-0.5 text-xs font-heading border border-border ${
                              isOut
                                ? 'bg-red-100 text-red-800'
                                : isLow
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {p.quantity_on_hand} in stock {isOut ? '(Out)' : isLow ? '(Low)' : ''}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                          <Button size="sm" variant="neutral" onClick={() => startEdit(p)}>
                            Edit
                          </Button>
                          <Button size="sm" onClick={() => deleteProduct(p.id)}>
                            Delete
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
