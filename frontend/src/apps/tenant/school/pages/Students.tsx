import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { authFetch } from '@/lib/auth'

type ClassRoom = {
  id: string
  name: string
}

type Student = {
  id: string
  full_name: string
  classroom: string | null
  classroom_name?: string
  roll_no: string
  dob: string | null
  created_at: string
}

const sections = ['Dashboard', 'Table', 'Add'] as const

export default function Students() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState<(typeof sections)[number]>('Dashboard')
  
  // Data States
  const [students, setStudents] = useState<Student[]>([])
  const [classrooms, setClassrooms] = useState<ClassRoom[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('')
  
  // Form State
  const [fullName, setFullName] = useState('')
  const [rollNo, setRollNo] = useState('')
  const [classroomId, setClassroomId] = useState('')
  const [dob, setDob] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    loadStudents()
    loadClassrooms()
  }, [])

  async function loadStudents() {
    try {
      setLoading(true)
      const res = await authFetch('/students/')
      if (res.ok) {
        const data = await res.json()
        setStudents(data)
      } else {
        setError('Failed to load students')
      }
    } catch (err) {
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }

  async function loadClassrooms() {
    try {
      const res = await authFetch('/classrooms/')
      if (res.ok) {
        const data = await res.json()
        setClassrooms(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  function resetForm() {
    setFullName('')
    setRollNo('')
    setClassroomId('')
    setDob('')
    setEditingId(null)
    setError('')
  }

  function startEdit(s: Student) {
    setEditingId(s.id)
    setFullName(s.full_name)
    setRollNo(s.roll_no)
    setClassroomId(s.classroom ?? '')
    setDob(s.dob ?? '')
    setError('')
    setActiveSection('Add') // Open the form section
  }

  async function submitStudent(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!fullName.trim() || fullName.trim().length < 3) {
      setError('Student full name must be at least 3 characters')
      return
    }

    if (!rollNo.trim()) {
      setError('Roll number is required')
      return
    }

    try {
      setLoading(true)
      const body = {
        full_name: fullName,
        roll_no: rollNo,
        classroom: classroomId === '' ? null : classroomId,
        dob: dob === '' ? null : dob
      }
      
      const endpoint = editingId ? `/students/${editingId}/` : '/students/'
      const method = editingId ? 'PUT' : 'POST'

      const res = await authFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        resetForm()
        loadStudents()
        setActiveSection('Table')
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

  async function deleteStudent(id: string) {
    if (!confirm('Are you sure you want to delete this student record?')) return
    try {
      const res = await authFetch(`/students/${id}/`, { method: 'DELETE' })
      if (res.ok) {
        loadStudents()
      } else {
        setError('Failed to delete student')
      }
    } catch (err) {
      setError('Delete request failed')
    }
  }

  // Filter students based on search query
  const filteredStudents = students.filter(s => 
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.roll_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.classroom_name && s.classroom_name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col gap-8">
        <header className="flex items-start justify-between">
          <div className="w-[160px]" />
          <div className="flex-1 space-y-3 text-center">
            <h1 className="text-4xl font-heading md:text-6xl">Students</h1>
            <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground">Student management hub</p>
          </div>
          <Button variant="neutral" onClick={() => navigate('/')}>
            Back to Dashboard
          </Button>
        </header>

        <div className="flex flex-wrap justify-center gap-3">
          {sections.map((section) => (
            <Button
              key={section}
              variant={activeSection === section ? 'default' : 'neutral'}
              onClick={() => {
                if (section === 'Add' && !editingId) resetForm()
                setActiveSection(section)
              }}
            >
              {section === 'Add' && editingId ? 'Edit Student Form' : section}
            </Button>
          ))}
        </div>

        {error && <p className="text-center text-sm text-red-600 font-medium">{error}</p>}

        <Card>
          <CardHeader>
            <CardTitle>{activeSection === 'Add' && editingId ? 'Edit Student' : activeSection}</CardTitle>
            <CardDescription>
              {activeSection === 'Dashboard' && 'Quick overview statistics of students.'}
              {activeSection === 'Table' && 'Search and edit active student registrations.'}
              {activeSection === 'Add' && 'Register a new student within the tenant database.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {activeSection === 'Dashboard' && (
              <div className="grid gap-6 md:grid-cols-3">
                <div className="rounded-base border-2 border-border bg-secondary-background p-6">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Students</p>
                  <p className="text-3xl font-heading mt-2">{students.length}</p>
                </div>
                <div className="rounded-base border-2 border-border bg-secondary-background p-6">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Assigned Classrooms</p>
                  <p className="text-3xl font-heading mt-2">
                    {students.filter(s => s.classroom !== null).length}
                  </p>
                </div>
                <div className="rounded-base border-2 border-border bg-secondary-background p-6 flex flex-col justify-between">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Action Shortcuts</p>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" className="w-full" onClick={() => setActiveSection('Table')}>Search List</Button>
                    <Button size="sm" variant="neutral" className="w-full" onClick={() => { resetForm(); setActiveSection('Add'); }}>+ Register</Button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'Table' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Search by student name, roll number, or classroom..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <Button variant="neutral" onClick={() => setSearchQuery('')}>Clear</Button>
                  )}
                </div>

                {loading && students.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Loading student list...</p>
                ) : filteredStudents.length === 0 ? (
                  <div className="rounded-base border-2 border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                    No student records found.
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-base border-2 border-border">
                    <table className="w-full border-collapse text-left" role="grid">
                      <thead className="bg-secondary-background">
                        <tr className="border-b-2 border-border">
                          <th className="px-4 py-3 text-sm font-heading">Roll No.</th>
                          <th className="px-4 py-3 text-sm font-heading">Name</th>
                          <th className="px-4 py-3 text-sm font-heading">Classroom</th>
                          <th className="px-4 py-3 text-sm font-heading">Date of Birth</th>
                          <th className="px-4 py-3 text-sm font-heading text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((s) => (
                          <tr key={s.id} className="border-b border-border hover:bg-secondary-background/20">
                            <td className="px-4 py-3 text-sm font-heading">{s.roll_no}</td>
                            <td className="px-4 py-3 text-sm font-heading">{s.full_name}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{s.classroom_name ?? 'Unassigned'}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{s.dob ?? 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-right space-x-2">
                              <Button size="sm" variant="neutral" onClick={() => startEdit(s)}>Edit</Button>
                              <Button size="sm" onClick={() => deleteStudent(s.id)}>Delete</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'Add' && (
              <form onSubmit={submitStudent} className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-heading">Roll Number / ID</label>
                  <Input 
                    placeholder="e.g. 2026-0045" 
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    aria-required="true"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-heading">Student Full Name</label>
                  <Input 
                    placeholder="e.g. Alice Smith" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    aria-required="true"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-heading">Classroom Assignment</label>
                  <select
                    className="w-full rounded-base border-2 border-border bg-secondary-background p-2.5 text-sm font-base text-foreground focus:outline-hidden focus:ring-2 focus:ring-black"
                    value={classroomId}
                    onChange={(e) => setClassroomId(e.target.value)}
                  >
                    <option value="">No classroom assigned</option>
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-heading">Date of Birth</label>
                  <Input 
                    type="date" 
                    placeholder="YYYY-MM-DD" 
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                  <Button type="button" variant="neutral" onClick={() => { resetForm(); setActiveSection('Table'); }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : editingId ? 'Update Student' : 'Register Student'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

