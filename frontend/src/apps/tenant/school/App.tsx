import { Button } from '@/components/ui/button'
import { AArrowDownIcon, User2Icon, UsersIcon } from 'lucide-react'

import { useAuth } from '@/components/AuthGate'

type Props = { tenantName: string }

export default function App({ tenantName }: Props) {
  const { user, logout } = useAuth()
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b-2 border-border p-4">
        <span className="text-sm">Signed in as <strong>{user.username}</strong></span>
        <Button variant="neutral" onClick={() => logout()}>Logout</Button>
      </header>

      <div className="p-8">
        <h1 className="mb-6 text-2xl font-heading">{tenantName} - School Dashboard</h1>
        <nav className="flex gap-4">
          <Button><User2Icon />Students</Button>
          <Button variant="neutral"><UsersIcon />Classrooms</Button>
          <Button variant="reverse"><AArrowDownIcon />Attendance</Button>
        </nav>
        <p className="mt-6 text-muted-foreground">School management interface.</p>
      </div>
    </div>
  )
}
