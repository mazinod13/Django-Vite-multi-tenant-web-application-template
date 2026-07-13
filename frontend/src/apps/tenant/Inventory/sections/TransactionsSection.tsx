import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { authFetch } from '@/lib/auth'

type Product = {
  id: string
  name: string
  sku: string
  quantity_on_hand: number
}

type StockTransaction = {
  id: string
  product: string
  product_name: string
  product_sku: string
  transaction_type: 'IN' | 'OUT' | 'ADJUST'
  quantity: number
  transaction_date: string
  username: string
  reference: string
}

export default function TransactionsSection() {
  const [transactions, setTransactions] = useState<StockTransaction[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form State
  const [productId, setProductId] = useState('')
  const [transType, setTransType] = useState<'IN' | 'OUT' | 'ADJUST'>('IN')
  const [qty, setQty] = useState('1')
  const [reference, setReference] = useState('')

  useEffect(() => {
    loadTransactions()
    loadProducts()
  }, [])

  async function loadTransactions() {
    try {
      setLoading(true)
      const res = await authFetch('/transactions/')
      if (res.ok) {
        const data = await res.json()
        // Sort descending by date
        const sorted = data.sort((a: StockTransaction, b: StockTransaction) => 
          new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
        )
        setTransactions(sorted)
      } else {
        setError('Failed to load transaction history')
      }
    } catch (err) {
      setError('Connection error loading logs')
    } finally {
      setLoading(false)
    }
  }

  async function loadProducts() {
    try {
      const res = await authFetch('/products/')
      if (res.ok) {
        const data = await res.json()
        setProducts(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function submitTransaction(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!productId || !qty) {
      setError('Please select a product and enter the transaction quantity.')
      return
    }

    const quantityVal = parseInt(qty)
    if (isNaN(quantityVal) || quantityVal <= 0) {
      setError('Transaction quantity must be a positive non-zero integer.')
      return
    }

    const targetProduct = products.find((p) => p.id === productId)
    if (!targetProduct) {
      setError('Selected product not found.')
      return
    }

    // Determine final signed quantity modification
    let adjustedQty = quantityVal
    if (transType === 'OUT') {
      adjustedQty = -quantityVal
      // Verify stock level before dispatching
      if (targetProduct.quantity_on_hand < quantityVal) {
        setError(`Insufficient stock! Only ${targetProduct.quantity_on_hand} available on hand.`)
        return
      }
    } else if (transType === 'ADJUST') {
      const rawQty = parseInt(qty)
      adjustedQty = rawQty // Use raw value directly
      if (isNaN(adjustedQty)) {
        setError('Adjustment quantity must be an integer.')
        return
      }
      if (targetProduct.quantity_on_hand + adjustedQty < 0) {
        setError(`Adjustment error! Stock cannot drop below 0 (current: ${targetProduct.quantity_on_hand}).`)
        return
      }
    }

    try {
      setLoading(true)

      // 1. Create StockTransaction record
      const transRes = await authFetch('/transactions/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: productId,
          transaction_type: transType,
          quantity: adjustedQty,
          reference,
        }),
      })

      if (transRes.ok) {
        // 2. Adjust Product count on the server
        const newTotal = targetProduct.quantity_on_hand + adjustedQty
        const prodPatch = await authFetch(`/products/${productId}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quantity_on_hand: newTotal,
          }),
        })

        if (prodPatch.ok) {
          setProductId('')
          setQty('1')
          setReference('')
          loadProducts()
          loadTransactions()
        } else {
          setError('Logged transaction but failed to update product stock counts.')
        }
      } else {
        const data = await transRes.json().catch(() => ({}))
        setError(Object.values(data).flat().join(' ') || 'Transaction failed')
      }
    } catch (err) {
      setError('Connection error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1 h-fit shadow-shadow">
        <CardHeader>
          <CardTitle>Log Stock Transaction</CardTitle>
          <CardDescription>Record stock dispatches, restocking, or adjustments.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitTransaction} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-heading">Select Product</label>
              <select
                className="w-full rounded-base border-2 border-border bg-secondary-background p-2.5 text-sm font-base text-foreground focus:outline-hidden focus:ring-2 focus:ring-black"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              >
                <option value="">Select inventory product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — {p.quantity_on_hand} on hand
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-heading">Transaction Type</label>
              <select
                className="w-full rounded-base border-2 border-border bg-secondary-background p-2.5 text-sm font-base text-foreground focus:outline-hidden focus:ring-2 focus:ring-black"
                value={transType}
                onChange={(e) => {
                  const val = e.target.value as 'IN' | 'OUT' | 'ADJUST'
                  setTransType(val)
                  if (val === 'ADJUST') setQty('0')
                  else setQty('1')
                }}
              >
                <option value="IN">Stock In / Restock (+)</option>
                <option value="OUT">Stock Out / Dispatch (-)</option>
                <option value="ADJUST">Reconciliation Adjustment (+/-)</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-heading">
                {transType === 'ADJUST' ? 'Quantity Offset (positive or negative)' : 'Quantity'}
              </label>
              <Input
                type="number"
                min={transType === 'ADJUST' ? undefined : '1'}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                aria-required="true"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-heading">Reference / Notes</label>
              <Input
                placeholder="e.g. Invoice #203, PO-980, Auditing offset..."
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>

            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Processing...' : 'Submit Transaction'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 shadow-shadow">
        <CardHeader>
          <CardTitle>Transaction Logs</CardTitle>
          <CardDescription>Auditable historical records of all inventory operations.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading transaction history...</p>
          ) : transactions.length === 0 ? (
            <div className="rounded-base border-2 border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No transactions logged yet. Log one on the left.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-base border-2 border-border">
              <table className="w-full border-collapse text-left">
                <thead className="bg-secondary-background">
                  <tr className="border-b-2 border-border text-xs">
                    <th className="px-4 py-3 font-heading">Date & Time</th>
                    <th className="px-4 py-3 font-heading">Product SKU</th>
                    <th className="px-4 py-3 font-heading">Type</th>
                    <th className="px-4 py-3 font-heading">Ref/Notes</th>
                    <th className="px-4 py-3 font-heading text-right">Qty Change</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b border-border hover:bg-secondary-background/10 text-sm">
                      <td className="px-4 py-3 text-muted-foreground font-mono">
                        {new Date(t.transaction_date).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-heading">{t.product_name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{t.product_sku}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-base px-2 py-0.5 text-xs font-heading border border-border ${
                            t.transaction_type === 'IN'
                              ? 'bg-green-100 text-green-800'
                              : t.transaction_type === 'OUT'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {t.transaction_type === 'IN' ? 'Restock' : t.transaction_type === 'OUT' ? 'Dispatch' : 'Adjust'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground truncate max-w-xs">
                        {t.reference || 'N/A'}
                        <div className="text-[10px]">by {t.username || 'System'}</div>
                      </td>
                      <td className={`px-4 py-3 text-right font-mono font-heading ${t.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {t.quantity > 0 ? `+${t.quantity}` : t.quantity}
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
