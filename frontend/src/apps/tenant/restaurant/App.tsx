import { BoxesIcon, CalendarIcon, ListOrderedIcon, TableIcon, UtensilsCrossedIcon } from 'lucide-react'

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

import MenuSection from './sections/MenuSection'
import OrdersSection from './sections/OrdersSection'
import TablesSection from './sections/TablesSection'
import ReservationsSection from './sections/ReservationsSection'
import InventorySection from './sections/InventorySection'

type NavEntry = { to: string; label: string; icon: typeof UtensilsCrossedIcon }

const NAV: NavEntry[] = [
  { to: '/', label: 'Menu', icon: UtensilsCrossedIcon },
  { to: '/orders', label: 'Orders', icon: ListOrderedIcon },
  { to: '/tables', label: 'Tables', icon: TableIcon },
  { to: '/reservations', label: 'Reservations', icon: CalendarIcon },
  { to: '/inventory', label: 'Inventory', icon: BoxesIcon },
]

function getPath() {
  return window.location.pathname
}

function goTo(path: string) {
  window.location.href = path
}

function NavItem({ to, label, icon: Icon }: NavEntry) {
  const active = getPath() === to
  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={active} onClick={() => goTo(to)}>
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
      <Button variant="neutral" size="sm" onClick={() => logout()}>
        Logout
      </Button>
    </div>
  )
}

function Header() {
  const current = NAV.find((n) => getPath() === n.to)
  return (
    <header className="flex items-center gap-2 border-b-2 border-border p-4">
      <SidebarTrigger />
      <h1 className="text-xl font-heading">{current?.label ?? 'Dashboard'}</h1>
    </header>
  )
}

type Props = { tenantName: string }

export default function App({ tenantName }: Props) {
  const path = getPath()

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4 text-lg font-heading">{tenantName}</SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Restaurant</SidebarGroupLabel>
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
          {path === '/' && <MenuSection />}
          {path === '/orders' && <OrdersSection />}
          {path === '/tables' && <TablesSection />}
          {path === '/reservations' && <ReservationsSection />}
          {path === '/inventory' && <InventorySection />}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
