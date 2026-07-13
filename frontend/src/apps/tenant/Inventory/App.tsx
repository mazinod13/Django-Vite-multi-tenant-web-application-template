import { Boxes, Truck, ArrowUpDown, Home, TrendingUp, Menu } from 'lucide-react'
import { BrowserRouter, Navigate, Route, Routes, Link, useLocation } from 'react-router-dom'

import { useAuth } from '@/components/AuthGate'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
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
  useSidebar,
} from '@/components/ui/sidebar'

import DashboardSection from './sections/DashboardSection'
import ProductsSection from './sections/ProductsSection'
import SuppliersSection from './sections/SuppliersSection'
import TransactionsSection from './sections/TransactionsSection'
import NepseSection from './sections/NepseSection'

type NavEntry = { to: string; label: string; icon: typeof Home }

const NAV: NavEntry[] = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/products', label: 'Products Stock', icon: Boxes },
  { to: '/suppliers', label: 'Suppliers', icon: Truck },
  { to: '/transactions', label: 'Stock Transactions', icon: ArrowUpDown },
  { to: '/nepse', label: 'NEPSE Market Explorer', icon: TrendingUp },
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
  const { toggleSidebar, open } = useSidebar()
  const { user, logout } = useAuth()
  
  return (
    <header className="flex items-center justify-between border-b-2 border-border p-4 bg-secondary-background/60 backdrop-blur-xs">
      <div className="flex items-center gap-3">
        <Button 
          variant={open ? "default" : "neutral"} 
          size="icon" 
          onClick={toggleSidebar} 
          className="h-8 w-8 transition-all duration-200"
        >
          <Menu className={cn("h-4 w-4 transition-transform duration-200", open ? "rotate-0" : "rotate-90")} />
        </Button>
        <h1 className="text-xl font-heading">{current?.label ?? 'Inventory Dashboard'}</h1>
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

function InventoryAppContent({ tenantName }: Props) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4 text-lg font-heading">{tenantName}</SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Stock Operations</SidebarGroupLabel>
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

      <SidebarInset>
        <Header />
        <main className="p-8">
          <Routes>
            <Route path="/" element={<DashboardSection />} />
            <Route path="/products" element={<ProductsSection />} />
            <Route path="/suppliers" element={<SuppliersSection />} />
            <Route path="/transactions" element={<TransactionsSection />} />
            <Route path="/nepse" element={<NepseSection />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function App({ tenantName }: Props) {
  return (
    <BrowserRouter>
      <InventoryAppContent tenantName={tenantName} />
    </BrowserRouter>
  )
}
