import { useState, useMemo, useEffect } from 'react'
import { authFetch } from '@/lib/auth'

export interface NepseCompany {
  id: string
  companyName: string
  symbol: string
  securityName: string
  status: string // 'A' = Active, 'D' = De-listed, 'S' = Suspended
  companyEmail: string
  website: string
  sectorName: string
  regulatoryBody: string
  instrumentType: string
}

export interface NepseLiveTrade {
  securityId: string
  securityName: string
  symbol: string
  indexId: number
  totalTradeQuantity: number
  lastTradedPrice: number
  percentageChange: number
  previousClose: number
  closePrice: number
}
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Marquee from '@/components/ui/marquee'
import { 
  Search, 
  ArrowUpDown, 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  Globe, 
  Mail, 
  Filter, 
  Info,
  Calendar,
  Layers
} from 'lucide-react'

type Tab = 'trades' | 'companies'
type SortFieldTrades = 'symbol' | 'lastTradedPrice' | 'percentageChange' | 'totalTradeQuantity'
type SortFieldCompanies = 'symbol' | 'companyName' | 'sectorName'
type SortOrder = 'asc' | 'desc'

export default function NepseSection() {
  const [activeTab, setActiveTab] = useState<Tab>('trades')
  
  // Data lists loaded dynamically from the backend API
  const [companies, setCompanies] = useState<NepseCompany[]>([])
  const [liveTrades, setLiveTrades] = useState<NepseLiveTrade[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    let active = true
    async function fetchNepseData() {
      try {
        setLoadingData(true)
        const [compRes, tradeRes] = await Promise.all([
          authFetch('/nepse/companies/'),
          authFetch('/nepse/trades/')
        ])
        if (compRes.ok && tradeRes.ok && active) {
          const comps = await compRes.json()
          const trades = await tradeRes.json()
          setCompanies(comps)
          setLiveTrades(trades)
        }
      } catch (err) {
        console.error('Error fetching NEPSE data:', err)
      } finally {
        if (active) setLoadingData(false)
      }
    }
    fetchNepseData()
    return () => {
      active = false
    }
  }, [])

  // Sector list for filter dropdown
  const uniqueSectors = useMemo(() => {
    const sectors = new Set<string>()
    companies.forEach(c => {
      if (c.sectorName) sectors.add(c.sectorName)
    })
    return Array.from(sectors).sort()
  }, [companies])

  // --- State for Trades Explorer ---
  const [tradeSearch, setTradeSearch] = useState('')
  const [tradeSortField, setTradeSortField] = useState<SortFieldTrades>('percentageChange')
  const [tradeSortOrder, setTradeSortOrder] = useState<SortOrder>('desc')
  const [tradePage, setTradePage] = useState(1)
  const itemsPerPage = 20

  // --- State for Companies Explorer ---
  const [companySearch, setCompanySearch] = useState('')
  const [companySector, setCompanySector] = useState('')
  const [companySortField, setCompanySortField] = useState<SortFieldCompanies>('symbol')
  const [companySortOrder, setCompanySortOrder] = useState<SortOrder>('asc')
  const [companyPage, setCompanyPage] = useState(1)

  // Top marquee feed - slow speed (35s) for smooth readability
  const marqueeItems = useMemo(() => {
    // Show top 25 active tickers
    return [...liveTrades]
      .filter(t => t.percentageChange !== 0)
      .sort((a, b) => b.totalTradeQuantity - a.totalTradeQuantity)
      .slice(0, 25)
      .map(t => {
        const isUp = t.percentageChange > 0
        return (
          <div key={t.symbol} className="flex items-center gap-1.5 px-3">
            <span className="font-heading text-sm text-foreground">{t.symbol}</span>
            <span className="font-mono text-xs text-muted-foreground">Rs.{t.lastTradedPrice.toFixed(1)}</span>
            <span className={`flex items-center text-xs font-heading ${isUp ? 'text-green-600' : 'text-red-600'}`}>
              {isUp ? '▲' : '▼'} {Math.abs(t.percentageChange).toFixed(2)}%
            </span>
          </div>
        )
      })
  }, [liveTrades])

  // Market Breadth Counters
  const marketStats = useMemo(() => {
    let gainers = 0, losers = 0, unchanged = 0
    liveTrades.forEach(t => {
      if (t.percentageChange > 0) gainers++
      else if (t.percentageChange < 0) losers++
      else unchanged++
    })
    return { gainers, losers, unchanged }
  }, [liveTrades])

  // --- Process and Filter Trades ---
  const filteredAndSortedTrades = useMemo(() => {
    let result = liveTrades.filter(t => 
      t.symbol.toLowerCase().includes(tradeSearch.toLowerCase()) ||
      t.securityName.toLowerCase().includes(tradeSearch.toLowerCase())
    )

    result.sort((a, b) => {
      let aVal: any = a[tradeSortField]
      let bVal: any = b[tradeSortField]

      if (typeof aVal === 'string') {
        return tradeSortOrder === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal)
      } else {
        return tradeSortOrder === 'asc' ? aVal - bVal : bVal - aVal
      }
    })

    return result
  }, [liveTrades, tradeSearch, tradeSortField, tradeSortOrder])

  // Paginated Trades
  const paginatedTrades = useMemo(() => {
    const start = (tradePage - 1) * itemsPerPage
    return filteredAndSortedTrades.slice(start, start + itemsPerPage)
  }, [filteredAndSortedTrades, tradePage])

  const totalTradePages = Math.ceil(filteredAndSortedTrades.length / itemsPerPage)

  // --- Process and Filter Companies ---
  const filteredAndSortedCompanies = useMemo(() => {
    let result = companies.filter(c => {
      const matchesSearch = 
        c.symbol.toLowerCase().includes(companySearch.toLowerCase()) ||
        c.companyName.toLowerCase().includes(companySearch.toLowerCase()) ||
        c.sectorName.toLowerCase().includes(companySearch.toLowerCase())
      
      const matchesSector = companySector === '' || c.sectorName === companySector
      
      return matchesSearch && matchesSector
    })

    result.sort((a, b) => {
      let aVal = a[companySortField]
      let bVal = b[companySortField]

      return companySortOrder === 'asc' 
        ? aVal.localeCompare(bVal) 
        : bVal.localeCompare(aVal)
    })

    return result
  }, [companies, companySearch, companySector, companySortField, companySortOrder])

  // Paginated Companies
  const paginatedCompanies = useMemo(() => {
    const start = (companyPage - 1) * itemsPerPage
    return filteredAndSortedCompanies.slice(start, start + itemsPerPage)
  }, [filteredAndSortedCompanies, companyPage])

  const totalCompanyPages = Math.ceil(filteredAndSortedCompanies.length / itemsPerPage)

  // Toggle sorting logic
  const handleSortTrades = (field: SortFieldTrades) => {
    if (tradeSortField === field) {
      setTradeSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setTradeSortField(field)
      setTradeSortOrder('desc') // default sorting is desc (highest first) for numeric/financials
    }
    setTradePage(1)
  }

  const handleSortCompanies = (field: SortFieldCompanies) => {
    if (companySortField === field) {
      setCompanySortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setCompanySortField(field)
      setCompanySortOrder('asc')
    }
    setCompanyPage(1)
  }

  if (loadingData) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-base border-2 border-border bg-background shadow-shadow">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-main border-t-transparent"></div>
          <p className="font-heading text-sm text-foreground">Fetching NEPSE stock records from database...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Dynamic Marquee Feed - Slowed down (35s speed) */}
      {marqueeItems.length > 0 && (
        <div className="w-full overflow-hidden rounded-base border-2 border-border shadow-shadow">
          <Marquee items={marqueeItems} speed="35s" />
        </div>
      )}

      {/* Main Container */}
      <Card className="shadow-shadow">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl">NEPSE Market Explorer</CardTitle>
            <CardDescription>Search, filter, and sort Nepalese Stock Exchange listed assets and live trading pricing.</CardDescription>
          </div>
          {/* Market Breadth Pill */}
          <div className="flex items-center gap-3 rounded-base border-2 border-border bg-background px-4 py-2 text-xs font-heading">
            <span className="text-green-600">▲ Up: {marketStats.gainers}</span>
            <span className="text-red-600">▼ Down: {marketStats.losers}</span>
            <span className="text-muted-foreground">■ Unch: {marketStats.unchanged}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tabs Selector */}
          <div className="flex border-b-2 border-border pb-1 gap-2">
            <button
              onClick={() => setActiveTab('trades')}
              className={`px-4 py-2 font-heading text-sm rounded-t-base border-2 border-b-0 transition-colors ${
                activeTab === 'trades'
                  ? 'bg-main text-main-foreground border-border translate-y-[3px] shadow-none'
                  : 'bg-secondary-background hover:bg-secondary-background/60 border-transparent'
              }`}
            >
              📊 Live Market Pricing ({liveTrades.length} Listed)
            </button>
            <button
              onClick={() => setActiveTab('companies')}
              className={`px-4 py-2 font-heading text-sm rounded-t-base border-2 border-b-0 transition-colors ${
                activeTab === 'companies'
                  ? 'bg-main text-main-foreground border-border translate-y-[3px] shadow-none'
                  : 'bg-secondary-background hover:bg-secondary-background/60 border-transparent'
              }`}
            >
              🏢 Listed Companies ({companies.length} Registered)
            </button>
          </div>

          {/* --- TAB 1: LIVE TRADES FEED --- */}
          {activeTab === 'trades' && (
            <div className="space-y-4">
              {/* Search & Sort Panel */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search by ticker symbol or security name..."
                    value={tradeSearch}
                    onChange={(e) => {
                      setTradeSearch(e.target.value)
                      setTradePage(1)
                    }}
                  />
                </div>
                {tradeSearch && (
                  <Button variant="neutral" onClick={() => { setTradeSearch(''); setTradePage(1); }}>
                    Reset Search
                  </Button>
                )}
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto rounded-base border-2 border-border">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-secondary-background text-xs font-heading">
                    <tr className="border-b-2 border-border">
                      <th 
                        className="px-4 py-3 cursor-pointer hover:bg-main/10 select-none"
                        onClick={() => handleSortTrades('symbol')}
                      >
                        <div className="flex items-center gap-1">
                          Symbol
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="px-4 py-3">Security Name</th>
                      <th 
                        className="px-4 py-3 cursor-pointer hover:bg-main/10 select-none text-right"
                        onClick={() => handleSortTrades('lastTradedPrice')}
                      >
                        <div className="flex items-center gap-1 justify-end">
                          LTP (Rs.)
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 cursor-pointer hover:bg-main/10 select-none text-right"
                        onClick={() => handleSortTrades('percentageChange')}
                      >
                        <div className="flex items-center gap-1 justify-end">
                          Daily Change (%)
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 cursor-pointer hover:bg-main/10 select-none text-right"
                        onClick={() => handleSortTrades('totalTradeQuantity')}
                      >
                        <div className="flex items-center gap-1 justify-end">
                          Trade Volume
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTrades.map((t) => {
                      const isUp = t.percentageChange > 0
                      const isUnchanged = t.percentageChange === 0
                      return (
                        <tr key={t.symbol} className="border-b border-border hover:bg-secondary-background/10 text-sm">
                          <td className="px-4 py-3 font-mono font-heading text-base">{t.symbol}</td>
                          <td className="px-4 py-3 font-medium text-muted-foreground">{t.securityName}</td>
                          <td className="px-4 py-3 text-right font-mono font-heading">
                            Rs. {t.lastTradedPrice.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={`inline-block rounded-base px-2 py-0.5 text-xs font-heading border border-border ${
                                isUnchanged
                                  ? 'bg-neutral-100 text-neutral-800'
                                  : isUp
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {isUnchanged ? '' : isUp ? '+' : ''}
                              {t.percentageChange.toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                            {t.totalTradeQuantity.toLocaleString()}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalTradePages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-muted-foreground font-heading">
                    Showing {(tradePage - 1) * itemsPerPage + 1} - {Math.min(tradePage * itemsPerPage, filteredAndSortedTrades.length)} of {filteredAndSortedTrades.length} trades
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="neutral" 
                      onClick={() => setTradePage(p => Math.max(1, p - 1))}
                      disabled={tradePage === 1}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-2 text-xs font-heading">
                      Page {tradePage} of {totalTradePages}
                    </span>
                    <Button 
                      size="sm" 
                      variant="neutral" 
                      onClick={() => setTradePage(p => Math.min(totalTradePages, p + 1))}
                      disabled={tradePage === totalTradePages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- TAB 2: LISTED COMPANIES --- */}
          {activeTab === 'companies' && (
            <div className="space-y-4">
              {/* Search, Filter & Sort Panel */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search by Symbol, Company Name, or Sector..."
                    value={companySearch}
                    onChange={(e) => {
                      setCompanySearch(e.target.value)
                      setCompanyPage(1)
                    }}
                  />
                </div>
                <div className="flex gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 border-2 border-border rounded-base px-2.5 bg-secondary-background text-xs font-heading">
                    <Filter className="h-3.5 w-3.5" />
                    <span>Sector:</span>
                    <select
                      className="bg-transparent border-0 focus:outline-hidden font-base text-xs pr-2"
                      value={companySector}
                      onChange={(e) => {
                        setCompanySector(e.target.value)
                        setCompanyPage(1)
                      }}
                    >
                      <option value="">All Sectors</option>
                      {uniqueSectors.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  {(companySearch || companySector) && (
                    <Button 
                      variant="neutral" 
                      onClick={() => {
                        setCompanySearch('')
                        setCompanySector('')
                        setCompanyPage(1)
                      }}
                    >
                      Reset
                    </Button>
                  )}
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto rounded-base border-2 border-border">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-secondary-background text-xs font-heading">
                    <tr className="border-b-2 border-border">
                      <th 
                        className="px-4 py-3 cursor-pointer hover:bg-main/10 select-none"
                        onClick={() => handleSortCompanies('symbol')}
                      >
                        <div className="flex items-center gap-1">
                          Symbol
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 cursor-pointer hover:bg-main/10 select-none"
                        onClick={() => handleSortCompanies('companyName')}
                      >
                        <div className="flex items-center gap-1">
                          Company Name
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 cursor-pointer hover:bg-main/10 select-none"
                        onClick={() => handleSortCompanies('sectorName')}
                      >
                        <div className="flex items-center gap-1">
                          Sector / Category
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Contacts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCompanies.map((c) => {
                      const isActive = c.status === 'A'
                      const isSuspended = c.status === 'S'
                      return (
                        <tr key={c.id} className="border-b border-border hover:bg-secondary-background/10 text-sm">
                          <td className="px-4 py-3 font-mono font-heading text-base">{c.symbol}</td>
                          <td className="px-4 py-3">
                            <div className="font-heading">{c.companyName}</div>
                            <div className="text-[10px] text-muted-foreground">Regulatory: {c.regulatoryBody}</div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground font-medium">{c.sectorName}</td>
                          <td className="px-4 py-3">
                            <span 
                              className={`inline-block rounded-base px-2 py-0.5 text-xs font-heading border border-border ${
                                isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : isSuspended 
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {isActive ? 'Active' : isSuspended ? 'Suspended' : 'Delisted'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                            {c.website && (
                              <a 
                                href={c.website.startsWith('http') ? c.website : `http://${c.website}`} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-heading"
                              >
                                <Globe className="h-3.5 w-3.5" /> Web
                              </a>
                            )}
                            {c.companyEmail && (
                              <a 
                                href={`mailto:${c.companyEmail}`}
                                className="inline-flex items-center gap-1 text-xs text-purple-600 hover:underline font-heading"
                              >
                                <Mail className="h-3.5 w-3.5" /> Email
                              </a>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalCompanyPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-muted-foreground font-heading">
                    Showing {(companyPage - 1) * itemsPerPage + 1} - {Math.min(companyPage * itemsPerPage, filteredAndSortedCompanies.length)} of {filteredAndSortedCompanies.length} companies
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="neutral" 
                      onClick={() => setCompanyPage(p => Math.max(1, p - 1))}
                      disabled={companyPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-2 text-xs font-heading">
                      Page {companyPage} of {totalCompanyPages}
                    </span>
                    <Button 
                      size="sm" 
                      variant="neutral" 
                      onClick={() => setCompanyPage(p => Math.min(totalCompanyPages, p + 1))}
                      disabled={companyPage === totalCompanyPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
