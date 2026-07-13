import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { authFetch } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Boxes, Truck, ArrowUpDown, AlertTriangle, RefreshCw } from 'lucide-react'

type Product = {
  id: string
  name: string
  sku: string
  quantity_on_hand: number
  reorder_level: number
}

type StockTransaction = {
  id: string
  product_name: string
  transaction_type: 'IN' | 'OUT' | 'ADJUST'
  quantity: number
  transaction_date: string
  username: string
}

export default function DashboardSection() {
  const [totalProducts, setTotalProducts] = useState(0)
  const [lowStockCount, setLowStockCount] = useState(0)
  const [outOfStockCount, setOutOfStockCount] = useState(0)
  const [recentTransactions, setRecentTransactions] = useState<StockTransaction[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      setLoading(true)

      // Fetch products
      const prodRes = await authFetch('/products/')
      if (prodRes.ok) {
        const prods: Product[] = await prodRes.ok ? await prodRes.json() : []
        setTotalProducts(prods.length)
        setLowStockCount(prods.filter((p) => p.quantity_on_hand <= p.reorder_level && p.quantity_on_hand > 0).length)
        setOutOfStockCount(prods.filter((p) => p.quantity_on_hand === 0).length)
      }

      // Fetch transactions (limit to latest 5)
      const transRes = await authFetch('/transactions/')
      if (transRes.ok) {
        const trans: StockTransaction[] = await transRes.json()
        const sorted = trans.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
        setRecentTransactions(sorted.slice(0, 5))
      }
    } catch (err) {
      console.error('Error loading dashboard stats:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-heading">Stock Summary</h2>
          <p className="text-sm text-muted-foreground">General warehouse status, reorder warnings, and transaction logs.</p>
        </div>
        <Button variant="neutral" onClick={loadStats} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <div className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
          <div className="flex items-center gap-4">
            <div className="rounded-base bg-blue-100 p-3 text-blue-800 border-2 border-border">
              <Boxes className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-heading">Total Products</p>
              <p className="text-3xl font-heading mt-1">{totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
          <div className="flex items-center gap-4">
            <div className="rounded-base bg-yellow-100 p-3 text-yellow-800 border-2 border-border">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-heading">Low Stock Alert</p>
              <p className="text-3xl font-heading mt-1">{lowStockCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
          <div className="flex items-center gap-4">
            <div className="rounded-base bg-red-100 p-3 text-red-800 border-2 border-border">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-heading">Out of Stock</p>
              <p className="text-3xl font-heading mt-1">{outOfStockCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow flex flex-col justify-between">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-heading">Log Transaction</p>
          <div className="flex gap-2 mt-2">
            <Button size="sm" className="w-full" asChild>
              <Link to="/transactions">+ Stock In</Link>
            </Button>
            <Button size="sm" variant="neutral" className="w-full" asChild>
              <Link to="/transactions">- Stock Out</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-base border-2 border-border p-6 bg-secondary-background shadow-shadow space-y-4">
          <h3 className="text-lg font-heading">Recent Stock Transactions</h3>
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent transaction logs found.</p>
          ) : (
            <div className="overflow-hidden rounded-base border-2 border-border bg-background">
              <table className="w-full border-collapse text-left">
                <thead className="bg-secondary-background">
                  <tr className="border-b-2 border-border">
                    <th className="px-4 py-2 text-xs font-heading">Date</th>
                    <th className="px-4 py-2 text-xs font-heading">Product</th>
                    <th className="px-4 py-2 text-xs font-heading">Type</th>
                    <th className="px-4 py-2 text-xs font-heading text-right">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((t) => (
                    <tr key={t.id} className="border-b border-border text-sm">
                      <td className="px-4 py-2 text-muted-foreground font-mono">
                        {new Date(t.transaction_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 font-heading">{t.product_name}</td>
                      <td className="px-4 py-2">
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
                      <td className={`px-4 py-2 text-right font-heading font-mono ${t.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {t.quantity > 0 ? `+${t.quantity}` : t.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-base border-2 border-border p-6 bg-secondary-background shadow-shadow space-y-4">
          <h3 className="text-lg font-heading">Quick Shortcuts</h3>
          <div className="space-y-2">
            <Button className="w-full justify-start" variant="neutral" asChild>
              <Link to="/products">📦 View Products Catalog</Link>
            </Button>
            <Button className="w-full justify-start" variant="neutral" asChild>
              <Link to="/suppliers">🚛 Manage Suppliers</Link>
            </Button>
            <Button className="w-full justify-start" variant="neutral" asChild>
              <Link to="/transactions">📋 Full Transactions Log</Link>
            </Button>
            <Button className="w-full justify-start" variant="neutral" asChild>
              <Link to="/nepse">📈 NEPSE Market Explorer</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
