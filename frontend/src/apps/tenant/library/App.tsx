import { BookOpen, Calendar, Users, Home, Sparkles } from 'lucide-react'
import { BrowserRouter, Navigate, Route, Routes, Link, useLocation } from 'react-router-dom'

import { useAuth } from '@/components/AuthGate'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'

import BooksSection from './sections/BooksSection'
import BorrowSection from './sections/BorrowSection'
import MembersSection from './sections/MembersSection'
import DashboardSection from './sections/DashboardSection'
import RecommendationsSection from './sections/RecommendationsSection'

import libraryImg from '@/assets/library.jpg'

type NavEntry = { to: string; label: string; icon: typeof BookOpen }

const NAV: NavEntry[] = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/books', label: 'Books Catalog', icon: BookOpen },
  { to: '/borrowings', label: 'Borrowings & Loans', icon: Calendar },
  { to: '/members', label: 'Members', icon: Users },
  { to: '/recommendations', label: 'Recommended Books', icon: Sparkles },
]

function NavItem({ to, label, icon: Icon }: NavEntry) {
  const location = useLocation()
  const active = location.pathname === to
  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={active} asChild>
        <Link to={to}>
          <Icon />
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function UserFooter() {
  const { user } = useAuth()
  return (
    <div className="flex items-center gap-2 p-2 text-sm w-full">
      <div className="h-8 w-8 rounded-full border-2 border-border bg-main flex items-center justify-center font-heading text-xs shadow-shadow">
        {user?.username ? user.username[0].toUpperCase() : 'U'}
      </div>
      <span className="truncate font-heading">{user.username}</span>
    </div>
  )
}

function Header() {
  const location = useLocation()
  const current = NAV.find((n) => location.pathname === n.to)
  const { user, logout } = useAuth()
  
  return (
    <header className="flex items-center justify-between border-b-2 border-border p-4 bg-secondary-background/60 backdrop-blur-xs">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <h1 className="text-xl font-heading">{current?.label ?? 'Library Dashboard'}</h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline text-xs font-heading bg-background border-2 border-border px-3 py-1.5 rounded-base shadow-shadow">
          User: {user?.username}
        </span>
        <Button variant="neutral" size="sm" onClick={() => logout()}>
          Logout
        </Button>
      </div>
    </header>
  )
}

type Props = { tenantName: string }

function LibraryAppContent({ tenantName }: Props) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4 text-lg font-heading">{tenantName}</SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Library Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV.map((item) => (
                  <NavItem key={item.to} {...item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <UserFooter />
        </SidebarFooter>
      </Sidebar>

      <SidebarInset 
        className="relative bg-cover bg-center bg-no-repeat bg-fixed"
        style={{ backgroundImage: `url(${libraryImg})` }}
      >
        {/* Transparent background overlay to maintain perfect readability */}
        <div className="absolute inset-0 bg-background/85 backdrop-blur-[3px]" />
        
        {/* Real Content Wrapper */}
        <div className="relative z-10 flex flex-col min-h-screen">
          <Header />
          <main className="p-8 flex-1">
            <Routes>
              <Route path="/" element={<DashboardSection />} />
              <Route path="/books" element={<BooksSection />} />
              <Route path="/borrowings" element={<BorrowSection />} />
              <Route path="/members" element={<MembersSection />} />
              <Route path="/recommendations" element={<RecommendationsSection />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function App({ tenantName }: Props) {
  return (
    <BrowserRouter>
      <LibraryAppContent tenantName={tenantName} />
    </BrowserRouter>
  )
}
