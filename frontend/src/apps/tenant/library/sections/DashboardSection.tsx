import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { authFetch } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { BookOpen, Calendar, Users, RefreshCw, Sparkles } from 'lucide-react'

// Import images from assets folder
import libraryImg from '@/assets/library.jpg'
import booksImg from '@/assets/books.jpg'

type Book = {
  id: string
  total_copies: number
  available_copies: number
}

type BorrowRecord = {
  id: string
  status: string
}

type TenantUser = {
  id: string
}

export default function DashboardSection() {
  const [booksCount, setBooksCount] = useState(0)
  const [totalCopies, setTotalCopies] = useState(0)
  const [activeLoans, setActiveLoans] = useState(0)
  const [membersCount, setMembersCount] = useState(0)
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      setLoading(true)
      // Fetch books
      const booksRes = await authFetch('/books/')
      if (booksRes.ok) {
        const books: Book[] = await booksRes.json()
        setBooksCount(books.length)
        setTotalCopies(books.reduce((acc, b) => acc + b.total_copies, 0))
      }

      // Fetch borrowings
      const borrowsRes = await authFetch('/borrows/')
      if (borrowsRes.ok) {
        const borrows: BorrowRecord[] = await borrowsRes.json()
        setActiveLoans(borrows.filter((b) => b.status === 'borrowed').length)
      }

      // Fetch members
      const usersRes = await authFetch('/users/')
      if (usersRes.ok) {
        const users: TenantUser[] = await usersRes.json()
        setMembersCount(users.length)
      }

      // Fetch recommendations
      const recsRes = await authFetch('/books/recommendations/')
      if (recsRes.ok) {
        const recs = await recsRes.json()
        setRecommendations(recs.slice(0, 3))
      }
    } catch (err) {
      console.error('Error loading dashboard stats:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Library Hero Banner Image with Overlay */}
      <div className="relative overflow-hidden rounded-base border-2 border-border shadow-shadow h-[220px]">
        <img src={libraryImg} alt="Library banner" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/45 flex items-center p-6 md:p-8">
          <div className="text-white space-y-2">
            <h2 className="text-3xl font-heading md:text-4xl text-white">Library Workspace</h2>
            <p className="text-xs md:text-sm font-heading max-w-md opacity-90">
              Manage your physical collection, trace borrowing loans, track overdue alerts, and issue member registration cards.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading">Overview</h2>
          <p className="text-sm text-muted-foreground">General library status and catalog metrics.</p>
        </div>
        <Button variant="neutral" onClick={loadStats} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-base bg-blue-100 p-3 text-blue-800 border-2 border-border">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Book Titles</p>
              <p className="text-3xl font-heading mt-1">{booksCount}</p>
              <p className="text-xs text-muted-foreground mt-1">({totalCopies} physical copies)</p>
            </div>
          </div>
        </div>

        <div className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-base bg-green-100 p-3 text-green-800 border-2 border-border">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Active Borrowings</p>
              <p className="text-3xl font-heading mt-1">{activeLoans}</p>
              <p className="text-xs text-muted-foreground mt-1">Checked out by active members</p>
            </div>
          </div>
        </div>

        <div className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-base bg-purple-100 p-3 text-purple-800 border-2 border-border">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Registered Members</p>
              <p className="text-3xl font-heading mt-1">{membersCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Total active library cards</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Recommendations Widget */}
      {recommendations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-heading flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500 fill-yellow-200" />
                Recommended Reads
              </h2>
              <p className="text-xs text-muted-foreground">Top personalized selections based on library activity.</p>
            </div>
            <Button variant="neutral" size="sm" asChild>
              <Link to="/recommendations">View All Suggestions</Link>
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {recommendations.map(({ book, reason }) => (
              <div 
                key={book.id} 
                className="rounded-base border-2 border-border bg-secondary-background p-4 shadow-sm hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <span className="inline-block rounded-base px-2 py-0.5 text-[10px] font-heading border-2 border-border bg-indigo-100 text-indigo-900">
                    Recommended
                  </span>
                  <h4 className="font-heading text-sm line-clamp-1">{book.title}</h4>
                  <p className="text-xs text-muted-foreground">by {book.author}</p>
                  <p className="text-[11px] bg-muted p-2 rounded-base border border-border/40 font-medium">
                    {reason}
                  </p>
                </div>
                <div className="mt-4 pt-2 border-t border-border/30 flex items-center justify-between">
                  <span className={`text-[10px] font-heading ${book.available_copies > 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {book.available_copies} available
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    ISBN: {book.isbn}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions (left) */}
        <div className="rounded-base border-2 border-border p-6 bg-secondary-background/30 space-y-4 flex flex-col justify-center">
          <h3 className="text-lg font-heading">Quick Actions</h3>
          <p className="text-xs text-muted-foreground">Quickly modify borrowing logs or insert brand new ISBN elements into the public catalog.</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/books">+ Catalog New Book</Link>
            </Button>
            <Button variant="neutral" asChild>
              <Link to="/borrowings">Issue Borrowing Record</Link>
            </Button>
          </div>
        </div>

        {/* Books catalog card illustration (right) */}
        <div className="rounded-base border-2 border-border bg-secondary-background overflow-hidden shadow-shadow flex flex-col justify-between">
          <div className="h-[140px] w-full overflow-hidden border-b-2 border-border">
            <img src={booksImg} alt="Books catalog" className="w-full h-full object-cover" />
          </div>
          <div className="p-4 space-y-1">
            <h4 className="text-sm font-heading">Digital Borrow Records</h4>
            <p className="text-xs text-muted-foreground">Update borrow/return statuses, set return guidelines, and manage overdue fine metrics.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
