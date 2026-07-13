import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { authFetch } from '@/lib/auth'
import { Sparkles, BookOpen, Star, Clock, Heart, Award } from 'lucide-react'

type Book = {
  id: string
  title: string
  author: string
  isbn: string
  total_copies: number
  available_copies: number
}

type Recommendation = {
  book: Book
  reason: string
}

export default function RecommendationsSection() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'personalized' | 'popular' | 'new'>('all')

  useEffect(() => {
    loadRecommendations()
  }, [])

  async function loadRecommendations() {
    try {
      setLoading(true)
      const res = await authFetch('/books/recommendations/')
      if (res.ok) {
        const data = await res.json()
        setRecommendations(data)
      } else {
        setError('Failed to fetch recommendations')
      }
    } catch (err) {
      setError('Connection error loading recommender system')
    } finally {
      setLoading(false)
    }
  }

  // Filter recommendations
  const filteredRecs = recommendations.filter((rec) => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'personalized') {
      return (
        rec.reason.toLowerCase().includes('read') ||
        rec.reason.toLowerCase().includes('borrow')
      )
    }
    if (activeFilter === 'popular') {
      return rec.reason.toLowerCase().includes('popular')
    }
    if (activeFilter === 'new') {
      return rec.reason.toLowerCase().includes('recently')
    }
    return true
  })

  // Help determine badge styling and icons
  function getBadgeProps(reason: string) {
    const text = reason.toLowerCase()
    if (text.includes('borrowed books') || text.includes('collaborative')) {
      return {
        className: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        icon: Sparkles,
        label: 'Community Match',
      }
    }
    if (text.includes('because you read') || text.includes('author')) {
      return {
        className: 'bg-pink-100 text-pink-800 border-pink-300',
        icon: Heart,
        label: 'Similar Taste',
      }
    }
    if (text.includes('popular')) {
      return {
        className: 'bg-amber-100 text-amber-800 border-amber-300',
        icon: Award,
        label: 'Popular',
      }
    }
    if (text.includes('recently')) {
      return {
        className: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        icon: Clock,
        label: 'New Release',
      }
    }
    return {
      className: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: BookOpen,
      label: 'Recommended',
    }
  }

  // Cover gradient helper to make the layout pop
  function getCoverGradient(title: string) {
    const gradients = [
      'from-rose-400 to-red-500',
      'from-amber-400 to-orange-500',
      'from-emerald-400 to-teal-500',
      'from-blue-400 to-indigo-500',
      'from-violet-400 to-purple-500',
      'from-fuchsia-400 to-pink-500',
    ]
    let hash = 0
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % gradients.length
    return gradients[index]
  }

  return (
    <div className="space-y-6">
      <div className="rounded-base border-2 border-border p-6 bg-secondary-background/60 backdrop-blur-xs flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-shadow">
        <div>
          <h2 className="text-2xl font-heading flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-yellow-500 fill-yellow-200" />
            Smart Recommendations
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Personalized reading suggestions generated from your history and library borrow trends.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', 'personalized', 'popular', 'new'] as const).map((filter) => (
            <Button
              key={filter}
              variant={activeFilter === filter ? 'default' : 'neutral'}
              size="sm"
              onClick={() => setActiveFilter(filter)}
              className="capitalize font-heading"
            >
              {filter === 'new' ? 'New Releases' : filter}
            </Button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-base border-2 border-red-500 bg-red-50 p-4 text-sm text-red-800 font-medium">
          {error}
        </div>
      )}

      {loading && filteredRecs.length === 0 ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredRecs.length === 0 ? (
        <div className="rounded-base border-2 border-dashed border-border p-16 text-center bg-secondary-background/30 shadow-shadow">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-3" />
          <h3 className="text-lg font-heading">No Recommendations Found</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
            {activeFilter === 'personalized'
              ? "You haven't borrowed any books yet! Start borrowing books to unlock community matches and content-based recommendations."
              : 'Try checking different filters or explore the main catalog.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRecs.map(({ book, reason }) => {
            const badge = getBadgeProps(reason)
            const BadgeIcon = badge.icon
            const gradient = getCoverGradient(book.title)
            
            return (
              <div
                key={book.id}
                className="group relative rounded-base border-2 border-border bg-secondary-background overflow-hidden hover:-translate-y-1 transition-all duration-300 shadow-shadow flex flex-col h-full"
              >
                {/* Book Cover Banner Representation with Stunning Gradient */}
                <div className={`h-36 bg-gradient-to-br ${gradient} p-4 flex flex-col justify-between border-b-2 border-border relative overflow-hidden`}>
                  <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4 group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="h-32 w-32" />
                  </div>
                  
                  {/* Category / Reason Badge */}
                  <span className="self-start inline-flex items-center gap-1 rounded-base px-2 py-0.5 text-xs font-heading border-2 border-border shadow-sm bg-white text-foreground">
                    <BadgeIcon className="h-3.5 w-3.5 text-black" />
                    {badge.label}
                  </span>
                  
                  <div className="text-white drop-shadow-md">
                    <p className="text-xs uppercase tracking-wider opacity-90 font-medium">ISBN: {book.isbn}</p>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-heading line-clamp-1 leading-snug group-hover:text-primary transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">by {book.author}</p>
                    
                    {/* Recommendation Reason explanation */}
                    <div className="rounded-base bg-muted/50 p-2.5 border border-border/60 text-xs text-foreground font-medium flex items-start gap-2">
                      <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-400 shrink-0 mt-0.5" />
                      <span>{reason}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/30">
                    <span
                      className={`inline-block rounded-base px-2 py-0.5 text-xs font-heading border-2 border-border ${
                        book.available_copies > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {book.available_copies} / {book.total_copies} available
                    </span>
                    
                    <span className="text-xs text-muted-foreground font-mono">ID: {book.id.slice(0, 8)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
