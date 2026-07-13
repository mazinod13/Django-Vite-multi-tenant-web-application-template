import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { authFetch } from '@/lib/auth'

const areas = ['Classes', 'Subjects', 'Timetable', 'Exams'] as const

type Teacher = {
  id: string
  username: string
  email: string
  role: string
}

type ClassRoom = {
  id: string
  name: string
  teacher: string | null
  teacher_name?: string
  capacity: number
  created_at: string
}

export default function Academics() {
  const navigate = useNavigate()
  const [activeArea, setActiveArea] = useState<(typeof areas)[number]>('Classes')
  
  // Classrooms State
  const [classrooms, setClassrooms] = useState<ClassRoom[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Form State
  const [name, setName] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [capacity, setCapacity] = useState('30')
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    if (activeArea === 'Classes') {
      loadClasses()
      loadTeachers()
    }
  }, [activeArea])

  async function loadClasses() {
    try {
      setLoading(true)
      const res = await authFetch('/classrooms/')
      if (res.ok) {
        const data = await res.json()
        setClassrooms(data)
      } else {
        setError('Failed to load classrooms')
      }
    } catch (err) {
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }

  async function loadTeachers() {
    try {
      const res = await authFetch('/users/')
      if (res.ok) {
        const data = await res.json()
        // Filter users that could be teachers
        setTeachers(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  function resetForm() {
    setName('')
    setTeacherId('')
    setCapacity('30')
    setEditingId(null)
    setError('')
  }

  function startEdit(c: ClassRoom) {
    setEditingId(c.id)
    setName(c.name)
    setTeacherId(c.teacher ?? '')
    setCapacity(c.capacity.toString())
    setError('')
  }

  async function submitClass(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Class name is required')
      return
    }

    const capNum = parseInt(capacity)
    if (isNaN(capNum) || capNum <= 0) {
      setError('Capacity must be a positive number')
      return
    }

    try {
      setLoading(true)
      const body = {
        name,
        capacity: capNum,
        teacher: teacherId === '' ? null : teacherId
      }
      
      const endpoint = editingId ? `/classrooms/${editingId}/` : '/classrooms/'
      const method = editingId ? 'PUT' : 'POST'

      const res = await authFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        resetForm()
        loadClasses()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(Object.values(data).flat().join(' ') || 'Save failed')
      }
    } catch (err) {
      setError('Server connection error')
    } finally {
      setLoading(false)
    }
  }

  async function deleteClass(id: string) {
    if (!confirm('Are you sure you want to delete this classroom?')) return
    try {
      const res = await authFetch(`/classrooms/${id}/`, { method: 'DELETE' })
      if (res.ok) {
        if (editingId === id) resetForm()
        loadClasses()
      } else {
        setError('Failed to delete classroom')
      }
    } catch (err) {
      setError('Delete request failed')
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col gap-8">
        <header className="flex items-start justify-between">
          <div className="w-[160px]" />
          <div className="flex-1 space-y-3 text-center">
            <h1 className="text-4xl font-heading md:text-6xl">Academics</h1>
            <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground">Academic planning hub</p>
          </div>
          <Button variant="neutral" onClick={() => navigate('/')}>
            Back to Dashboard
          </Button>
        </header>

        <div className="flex flex-wrap justify-center gap-3">
          {areas.map((area) => (
            <Button
              key={area}
              variant={activeArea === area ? 'default' : 'neutral'}
              onClick={() => setActiveArea(area)}
            >
              {area}
            </Button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {activeArea === 'Classes' && (
            <>
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>{editingId ? 'Edit Class' : 'Create a Class'}</CardTitle>
                  <CardDescription>Setup classrooms and assign teachers.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={submitClass} className="space-y-4">
                    <div>
                      <label className="mb-1 block text-xs font-heading">Class Name</label>
                      <Input 
                        placeholder="e.g. Grade 5A" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        aria-required="true"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-heading">Assign Teacher</label>
                      <select
                        className="w-full rounded-base border-2 border-border bg-secondary-background p-2.5 text-sm font-base text-foreground focus:outline-hidden focus:ring-2 focus:ring-black"
                        value={teacherId}
                        onChange={(e) => setTeacherId(e.target.value)}
                      >
                        <option value="">No teacher assigned</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>{t.username} ({t.role})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-heading">Student Capacity</label>
                      <Input 
                        type="number" 
                        placeholder="e.g. 30" 
                        value={capacity} 
                        onChange={(e) => setCapacity(e.target.value)} 
                        aria-required="true"
                      />
                    </div>
                    {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
                    <div className="flex gap-2 pt-2">
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Saving...' : editingId ? 'Update' : 'Create'}
                      </Button>
                      {editingId && (
                        <Button type="button" variant="neutral" onClick={resetForm}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Classrooms</CardTitle>
                  <CardDescription>Active lists of rooms and capacities.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading && classrooms.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Loading classrooms...</p>
                  ) : classrooms.length === 0 ? (
                    <div className="rounded-base border-2 border-dashed border-border p-10 text-center">
                      <p className="text-sm text-muted-foreground">No classrooms created yet. Create one on the left.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-base border-2 border-border">
                      <table className="w-full border-collapse text-left" role="grid">
                        <thead className="bg-secondary-background">
                          <tr className="border-b-2 border-border">
                            <th className="px-4 py-3 text-sm font-heading">Class Name</th>
                            <th className="px-4 py-3 text-sm font-heading">Teacher</th>
                            <th className="px-4 py-3 text-sm font-heading">Capacity</th>
                            <th className="px-4 py-3 text-sm font-heading text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {classrooms.map((c) => (
                            <tr key={c.id} className="border-b border-border hover:bg-secondary-background/20">
                              <td className="px-4 py-3 text-sm font-heading">{c.name}</td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">{c.teacher_name ?? 'Unassigned'}</td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">{c.capacity} students</td>
                              <td className="px-4 py-3 text-sm text-right space-x-2">
                                <Button size="sm" variant="neutral" onClick={() => startEdit(c)}>Edit</Button>
                                <Button size="sm" onClick={() => deleteClass(c.id)}>Delete</Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {activeArea !== 'Classes' && (
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>{activeArea}</CardTitle>
                <CardDescription>Academic configurations for this tenant schema.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-base border-2 border-dashed border-border bg-secondary-background p-10 text-center">
                  <h3 className="text-lg font-heading mb-2">{activeArea} Module - Integrated Mock Preview</h3>
                  <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                    The {activeArea} planner allows you to structure curriculums, timeslots, and exam calendars. 
                    These configurations are stored within the current tenant database workspace.
                  </p>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <Input placeholder={`${activeArea.slice(0, -1)} Title / Name`} disabled />
                  <Input placeholder="Location / Room / Reference Code" disabled />
                </div>
                <div className="flex justify-end gap-3 opacity-50">
                  <Button type="button" variant="neutral" disabled>Cancel</Button>
                  <Button type="button" disabled>Save {activeArea.slice(0, -1)}</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  )
}

