import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { authFetch } from '@/lib/auth'

type Book = {
  id: string
  title: string
  available_copies: number
}

type TenantUser = {
  id: string
  username: string
}

type BorrowRecord = {
  id: string
  book: string
  book_title: string
  user: string
  username: string
  borrowed_at: string
  due_date: string
  returned_at: string | null
  status: 'borrowed' | 'returned' | 'overdue'
}

export default function BorrowSection() {
  const [borrowings, setBorrowings] = useState<BorrowRecord[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [users, setUsers] = useState<TenantUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form State
  const [bookId, setBookId] = useState('')
  const [userId, setUserId] = useState('')
  const [dueDate, setDueDate] = useState('')

  useEffect(() => {
    loadBorrowings()
    loadBooks()
    loadUsers()
  }, [])

  async function loadBorrowings() {
    try {
      setLoading(true)
      const res = await authFetch('/borrows/')
      if (res.ok) {
        const data = await res.json()
        setBorrowings(data)
      }
    } catch (err) {
      setError('Connection error loading loans')
    } finally {
      setLoading(false)
    }
  }

  async function loadBooks() {
    try {
      const res = await authFetch('/books/')
      if (res.ok) {
        const data: Book[] = await res.json()
        setBooks(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function loadUsers() {
    try {
      const res = await authFetch('/users/')
      if (res.ok) {
        const data: TenantUser[] = await res.json()
        setUsers(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function submitBorrow(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!bookId || !userId || !dueDate) {
      setError('Please select a book, a member, and set a due date.')
      return
    }

    try {
      setLoading(true)
      const res = await authFetch('/borrows/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book: bookId,
          user: userId,
          due_date: dueDate,
          status: 'borrowed',
        }),
      })

      if (res.ok) {
        // Adjust book copy count locally or reload catalog
        const targetBook = books.find((b) => b.id === bookId)
        if (targetBook) {
          // Decrement available copy
          const updateRes = await authFetch(`/books/${bookId}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              available_copies: Math.max(0, targetBook.available_copies - 1),
            }),
          })
          if (updateRes.ok) {
            loadBooks()
          }
        }
        setBookId('')
        setUserId('')
        setDueDate('')
        loadBorrowings()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(Object.values(data).flat().join(' ') || 'Borrow issue failed')
      }
    } catch (err) {
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }

  async function returnBook(borrowing: BorrowRecord) {
    try {
      setLoading(true)
      const nowStr = new Date().toISOString()
      const res = await authFetch(`/borrows/${borrowing.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'returned',
          returned_at: nowStr,
        }),
      })

      if (res.ok) {
        // Increment book available copies
        const targetBook = books.find((b) => b.id === borrowing.book)
        if (targetBook) {
          await authFetch(`/books/${borrowing.book}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              available_copies: targetBook.available_copies + 1,
            }),
          })
          loadBooks()
        }
        loadBorrowings()
      } else {
        setError('Return processing failed')
      }
    } catch (err) {
      setError('Server request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1 h-fit">
        <CardHeader>
          <CardTitle>Issue Loan Record</CardTitle>
          <CardDescription>Register a book check-out to a registered member.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitBorrow} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-heading">Select Book</label>
              <select
                className="w-full rounded-base border-2 border-border bg-secondary-background p-2.5 text-sm font-base text-foreground focus:outline-hidden focus:ring-2 focus:ring-black"
                value={bookId}
                onChange={(e) => setBookId(e.target.value)}
              >
                <option value="">Choose a book catalog entry...</option>
                {books.map((b) => (
                  <option key={b.id} value={b.id} disabled={b.available_copies === 0}>
                    {b.title} ({b.available_copies} available)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-heading">Borrower Member</label>
              <select
                className="w-full rounded-base border-2 border-border bg-secondary-background p-2.5 text-sm font-base text-foreground focus:outline-hidden focus:ring-2 focus:ring-black"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              >
                <option value="">Select library account...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-heading">Return Due Date</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                aria-required="true"
              />
            </div>

            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Processing...' : 'Issue Book'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Active Loan Records</CardTitle>
          <CardDescription>Track active loans, returns, and overdue book statuses.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && borrowings.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading loan listings...</p>
          ) : borrowings.length === 0 ? (
            <div className="rounded-base border-2 border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No borrow records issued.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-base border-2 border-border">
              <table className="w-full border-collapse text-left" role="grid">
                <thead className="bg-secondary-background">
                  <tr className="border-b-2 border-border">
                    <th className="px-4 py-3 text-sm font-heading">Book</th>
                    <th className="px-4 py-3 text-sm font-heading">Borrower</th>
                    <th className="px-4 py-3 text-sm font-heading">Issued Date</th>
                    <th className="px-4 py-3 text-sm font-heading">Due Date</th>
                    <th className="px-4 py-3 text-sm font-heading">Status</th>
                    <th className="px-4 py-3 text-sm font-heading text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {borrowings.map((br) => (
                    <tr key={br.id} className="border-b border-border hover:bg-secondary-background/20">
                      <td className="px-4 py-3 text-sm font-heading">{br.book_title}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{br.username}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(br.borrowed_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{br.due_date}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-block rounded-base px-2 py-0.5 text-xs font-heading border-2 border-border ${
                            br.status === 'returned'
                              ? 'bg-green-100 text-green-800'
                              : br.status === 'overdue'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {br.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {br.status === 'borrowed' && (
                          <Button size="sm" variant="neutral" onClick={() => returnBook(br)}>
                            Mark Returned
                          </Button>
                        )}
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
