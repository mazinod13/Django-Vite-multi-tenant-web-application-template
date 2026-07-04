import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { useAuth } from '@/components/AuthGate'

export default function Dashboard() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl flex-col gap-8">
        <header className="flex items-start justify-between">
          <Button variant="neutral" onClick={() => logout()}>
            Logout
          </Button>
          <div className="flex-1 space-y-3 text-center">
            <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground">School Management System</p>
            <h1 className="text-4xl font-heading md:text-6xl">Dashboard</h1>
          </div>
          <div className="w-[92px]" />
        </header>

        <nav className="grid gap-4 md:grid-cols-3">
          <Button className="h-24 text-xl" size="lg" onClick={() => navigate('/students')}>
            Students
          </Button>
          <Button className="h-24 text-xl" size="lg" variant="neutral" onClick={() => navigate('/administration')}>
            Administration
          </Button>
          <Button className="h-24 text-xl" size="lg" variant="reverse" onClick={() => navigate('/academics')}>
            Academics
          </Button>
        </nav>

        <section className="flex flex-col items-center gap-4">
          <Calendar mode="single" selected={date} onSelect={setDate} />
        </section>
      </div>
    </main>
  )
}
