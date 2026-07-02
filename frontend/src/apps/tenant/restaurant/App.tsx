import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import {
  BoxesIcon,
  CalendarIcon,
  ListOrderedIcon,
  TableIcon,
  UtensilsCrossedIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

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
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/AuthGate'

import MenuSection from './sections/MenuSection'
import OrdersSection from './sections/OrdersSection'
import TablesSection from './sections/TablesSection'
import ReservationsSection from './sections/ReservationsSection'
import InventorySection from './sections/InventorySection'

type NavEntry = { to: string; label: string; icon: LucideIcon; end?: boolean }

const NAV: NavEntry[] = [
  { to: '/', label: 'Menu', icon: UtensilsCrossedIcon, end: true },
  { to: '/orders', label: 'Orders', icon: ListOrderedIcon },
  { to: '/tables', label: 'Tables', icon: TableIcon },
  { to: '/reservations', label: 'Reservations', icon: CalendarIcon },
  { to: '/inventory', label: 'Inventory', icon: BoxesIcon },
]

// active state comes from the URL now, not local state
function NavItem({ to, label, icon: Icon, end }: NavEntry) {
  const location = useLocation()
  const navigate = useNavigate()
  const active = end ? location.pathname === to : location.pathname.startsWith(to)
  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={active} onClick={() => navigate(to)}>
        <Icon />
        <span>{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function UserFooter() {
  const { user, logout } = useAuth()
  return (
    <div className="flex items-center justify-between gap-2 p-2 text-sm">
      <span className="truncate font-heading">{user.username}</span>
      <Button variant="neutral" size="sm" onClick={() => logout()}>Logout</Button>
    </div>
  )
}

function Header() {
  const location = useLocation()
  const current = NAV.find((n) =>
    n.end ? location.pathname === n.to : location.pathname.startsWith(n.to),
  )
  return (
    <header className="flex items-center gap-2 border-b-2 border-border p-4">
      <SidebarTrigger />
      <h1 className="text-xl font-heading">{current?.label ?? 'Dashboard'}</h1>
    </header>
  )
}

type Props = { tenantName: string }

export default function App({ tenantName }: Props) {
  return (
    <BrowserRouter>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader className="p-4 text-lg font-heading">{tenantName}</SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Restaurant</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {NAV.map((item) => <NavItem key={item.to} {...item} />)}
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
              <Route path="/" element={<MenuSection />} />
              <Route path="/orders" element={<OrdersSection />} />
              <Route path="/tables" element={<TablesSection />} />
              <Route path="/reservations" element={<ReservationsSection />} />
              <Route path="/inventory" element={<InventorySection />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </BrowserRouter>
  )
}
