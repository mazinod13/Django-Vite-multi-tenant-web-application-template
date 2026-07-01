import { useState } from 'react'
import {
  BoxesIcon,
  CalendarIcon,
  ListOrderedIcon,
  TableIcon,
  UtensilsCrossedIcon,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

const NAV = [
  { key: 'menu', label: 'Menu', icon: UtensilsCrossedIcon },
  { key: 'orders', label: 'Orders', icon: ListOrderedIcon },
  { key: 'tables', label: 'Tables', icon: TableIcon },
  { key: 'reservations', label: 'Reservations', icon: CalendarIcon },
  { key: 'inventory', label: 'Inventory', icon: BoxesIcon },
]

type Props = { tenantName: string }

export default function App({ tenantName }: Props) {
  const [active, setActive] = useState('menu')
  const activeLabel = NAV.find((n) => n.key === active)?.label

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
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      isActive={active === item.key}
                      onClick={() => setActive(item.key)}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        <header className="flex items-center gap-2 border-b-2 border-border p-4">
          <SidebarTrigger />
          <h1 className="text-xl font-heading">{tenantName} - {activeLabel}</h1>
        </header>

        <main className="p-8">
          {active === 'menu' ? (
            <div className="space-y-4">
              <p className="text-muted-foreground">Manage your menu items here.</p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button>View Menu</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Checking Menu?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will give you a list of Menu..
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction>Continue</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <p className="text-muted-foreground">{activeLabel} section — coming soon.</p>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
