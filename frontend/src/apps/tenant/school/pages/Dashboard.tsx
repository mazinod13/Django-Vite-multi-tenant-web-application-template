import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/components/AuthGate'
import { authFetch } from '@/lib/auth'

export default function Dashboard() {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const [date, setDate] = useState<Date | undefined>(new Date())

  // Metrics states
  const [studentCount, setStudentCount] = useState<number | null>(null)
  const [classroomCount, setClassroomCount] = useState<number | null>(null)
  const [userCount, setUserCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMetrics() {
      try {
        setLoading(true)
        const [studentsRes, classesRes, usersRes] = await Promise.all([
          authFetch('/students/'),
          authFetch('/classrooms/'),
          authFetch('/users/')
        ])

        if (studentsRes.ok) {
          const students = await studentsRes.json()
          setStudentCount(students.length)
        }
        if (classesRes.ok) {
          const classes = await classesRes.json()
          setClassroomCount(classes.length)
        }
        if (usersRes.ok) {
          const usersList = await usersRes.json()
          setUserCount(usersList.length)
        }
      } catch (err) {
        console.error('Error fetching metrics:', err)
      } finally {
        setLoading(false)
      }
    }
    loadMetrics()
  }, [])

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl flex-col gap-8">
        <header className="flex items-center justify-between">
          <div className="w-[92px]" />
          <div className="flex-1 space-y-2 text-center">
            <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground">School Management System</p>
            <h1 className="text-4xl font-heading md:text-6xl">Dashboard</h1>
            <p className="text-xs text-muted-foreground">Welcome back, <span className="font-heading text-foreground">{user.username}</span></p>
          </div>
          <Button variant="neutral" onClick={() => logout()}>
            Logout
          </Button>
        </header>

        <section className="grid gap-6 sm:grid-cols-3">
          <Card 
            className="cursor-pointer hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none transition-all"
            onClick={() => navigate('/students')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Registered Students</CardTitle>
              <CardDescription>View and manage students list</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-heading">
                {loading ? '...' : studentCount !== null ? studentCount : '0'}
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none transition-all"
            onClick={() => navigate('/academics')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Classrooms</CardTitle>
              <CardDescription>Setup levels and assigned teachers</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-heading">
                {loading ? '...' : classroomCount !== null ? classroomCount : '0'}
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none transition-all"
            onClick={() => navigate('/administration')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Users & Roles</CardTitle>
              <CardDescription>Manage teacher and staff access</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-heading">
                {loading ? '...' : userCount !== null ? userCount : '0'}
              </p>
            </CardContent>
          </Card>
        </section>

        <nav className="grid gap-4 md:grid-cols-3">
          <Button className="h-16 text-lg" onClick={() => navigate('/students')}>
            Go to Students
          </Button>
          <Button className="h-16 text-lg" variant="neutral" onClick={() => navigate('/administration')}>
            Go to Administration
          </Button>
          <Button className="h-16 text-lg" variant="reverse" onClick={() => navigate('/academics')}>
            Go to Academics
          </Button>
        </nav>

        <section className="flex flex-col items-center gap-4 bg-secondary-background/30 p-6 rounded-base border-2 border-border">
          <h2 className="font-heading text-sm uppercase tracking-wider text-muted-foreground mb-2">School Calendar</h2>
          <Calendar mode="single" selected={date} onSelect={setDate} />
        </section>
      </div>
    </main>
  )
}

