import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { authFetch } from '@/lib/auth'

type Book = {
  id: string
  title: string
  author: string
  isbn: string
  total_copies: number
  available_copies: number
}

export default function BooksSection() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [isbn, setIsbn] = useState('')
  const [totalCopies, setTotalCopies] = useState('1')
  const [availableCopies, setAvailableCopies] = useState('1')

  useEffect(() => {
    loadBooks()
  }, [])

  async function loadBooks() {
    try {
      setLoading(true)
      const res = await authFetch('/books/')
      if (res.ok) {
        const data = await res.json()
        setBooks(data)
      } else {
        setError('Failed to load books catalog')
      }
    } catch (err) {
      setError('Connection error loading books')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setTitle('')
    setAuthor('')
    setIsbn('')
    setTotalCopies('1')
    setAvailableCopies('1')
    setEditingId(null)
    setIsEditing(false)
    setError('')
  }

  function startEdit(book: Book) {
    setEditingId(book.id)
    setTitle(book.title)
    setAuthor(book.author)
    setIsbn(book.isbn)
    setTotalCopies(book.total_copies.toString())
    setAvailableCopies(book.available_copies.toString())
    setIsEditing(true)
    setError('')
  }

  async function submitBook(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!title.trim() || !author.trim() || !isbn.trim()) {
      setError('Title, Author, and ISBN are required.')
      return
    }

    const total = parseInt(totalCopies)
    const available = parseInt(availableCopies)

    if (isNaN(total) || total < 0 || isNaN(available) || available < 0) {
      setError('Copies count must be non-negative integers.')
      return
    }

    if (available > total) {
      setError('Available copies cannot exceed total copies.')
      return
    }

    try {
      setLoading(true)
      const body = {
        title,
        author,
        isbn,
        total_copies: total,
        available_copies: available,
      }

      const endpoint = editingId ? `/books/${editingId}/` : '/books/'
      const method = editingId ? 'PUT' : 'POST'

      const res = await authFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        resetForm()
        loadBooks()
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

  async function deleteBook(id: string) {
    if (!confirm('Are you sure you want to remove this book from the catalog?')) return
    try {
      const res = await authFetch(`/books/${id}/`, { method: 'DELETE' })
      if (res.ok) {
        loadBooks()
      } else {
        setError('Failed to delete book')
      }
    } catch (err) {
      setError('Delete request failed')
    }
  }

  const filteredBooks = books.filter(
    (b) =>
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.isbn.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1 h-fit lg:sticky lg:top-6">
        <CardHeader>
          <CardTitle>{editingId ? 'Edit Book Record' : 'Catalog New Book'}</CardTitle>
          <CardDescription>Enter book publication details for the catalog.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitBook} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-heading">Book Title</label>
              <Input
                placeholder="e.g. The Great Gatsby"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                aria-required="true"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-heading">Author Name</label>
              <Input
                placeholder="e.g. F. Scott Fitzgerald"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                aria-required="true"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-heading">ISBN Code</label>
              <Input
                placeholder="e.g. 9780743273565"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                aria-required="true"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-heading">Total Copies</label>
                <Input
                  type="number"
                  min="0"
                  value={totalCopies}
                  onChange={(e) => setTotalCopies(e.target.value)}
                  aria-required="true"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-heading">Available Copies</label>
                <Input
                  type="number"
                  min="0"
                  value={availableCopies}
                  onChange={(e) => setAvailableCopies(e.target.value)}
                  aria-required="true"
                />
              </div>
            </div>

            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

            <div className="flex gap-2 pt-2">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Saving...' : editingId ? 'Update Record' : 'Register Book'}
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

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Books Collection</CardTitle>
          <CardDescription>Search and filter registered books in library storage.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search by title, author, or ISBN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button variant="neutral" onClick={() => setSearchQuery('')}>
                Clear
              </Button>
            )}
          </div>

          {loading && books.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading books catalog...</p>
          ) : filteredBooks.length === 0 ? (
            <div className="rounded-base border-2 border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No book records matching search query.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-base border-2 border-border">
              <table className="w-full border-collapse text-left" role="grid">
                <thead className="bg-secondary-background">
                  <tr className="border-b-2 border-border">
                    <th className="px-4 py-3 text-sm font-heading">Book Title</th>
                    <th className="px-4 py-3 text-sm font-heading">Author</th>
                    <th className="px-4 py-3 text-sm font-heading">ISBN</th>
                    <th className="px-4 py-3 text-sm font-heading">Availability</th>
                    <th className="px-4 py-3 text-sm font-heading text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.map((b) => (
                    <tr key={b.id} className="border-b border-border hover:bg-secondary-background/20">
                      <td className="px-4 py-3 text-sm font-heading">{b.title}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{b.author}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{b.isbn}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-block rounded-base px-2 py-0.5 text-xs font-heading border-2 border-border ${
                            b.available_copies > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {b.available_copies} / {b.total_copies} available
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right space-x-2">
                        <Button size="sm" variant="neutral" onClick={() => startEdit(b)}>
                          Edit
                        </Button>
                        <Button size="sm" onClick={() => deleteBook(b.id)}>
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
