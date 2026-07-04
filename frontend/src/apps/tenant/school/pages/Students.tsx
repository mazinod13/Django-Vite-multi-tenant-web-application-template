import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const sections = ['Dashboard', 'Search', 'Table', 'Add', 'Edit', 'Details'] as const

export default function Students() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState<(typeof sections)[number]>('Dashboard')

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
              onClick={() => setActiveSection(section)}
            >
              {section}
            </Button>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{activeSection}</CardTitle>
            <CardDescription>Placeholder CRUD structure for the students module.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {activeSection === 'Dashboard' && (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {['Student Table', 'Student Search', 'Add Student', 'Student Details'].map((item) => (
                  <div key={item} className="rounded-base border-2 border-border bg-secondary-background p-4">
                    <p className="font-heading">{item}</p>
                    <p className="mt-2 text-sm text-muted-foreground">Placeholder entry point.</p>
                  </div>
                ))}
              </div>
            )}

            {activeSection === 'Search' && (
              <div className="space-y-4">
                <Input placeholder="Search by roll number, name, section, email, or mobile" />
                <div className="rounded-base border-2 border-dashed border-border bg-secondary-background p-6 text-sm text-muted-foreground">
                  Search results area.
                </div>
              </div>
            )}

            {activeSection === 'Table' && (
              <div className="overflow-hidden rounded-base border-2 border-border">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-secondary-background">
                    <tr className="border-b-2 border-border">
                      <th className="px-4 py-3 text-sm font-heading">Roll No.</th>
                      <th className="px-4 py-3 text-sm font-heading">Name</th>
                      <th className="px-4 py-3 text-sm font-heading">Section</th>
                      <th className="px-4 py-3 text-sm font-heading">Email</th>
                      <th className="px-4 py-3 text-sm font-heading">Mobile No.</th>
                      <th className="px-4 py-3 text-sm font-heading">Parent&apos;s Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-6 text-sm text-muted-foreground" colSpan={6}>
                        Table structure ready for student records.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeSection === 'Add' && (
              <form className="grid gap-4 md:grid-cols-2">
                <Input placeholder="Roll No." />
                <Input placeholder="Name" />
                <Input placeholder="Section" />
                <Input placeholder="Email" />
                <Input placeholder="Mobile No." />
                <Input placeholder="Parent's Name" />
                <div className="md:col-span-2 flex justify-end gap-3">
                  <Button type="button" variant="neutral">
                    Cancel
                  </Button>
                  <Button type="button">Save Student</Button>
                </div>
              </form>
            )}

            {activeSection === 'Edit' && (
              <form className="grid gap-4 md:grid-cols-2">
                <Input placeholder="Roll No." />
                <Input placeholder="Name" />
                <Input placeholder="Section" />
                <Input placeholder="Email" />
                <Input placeholder="Mobile No." />
                <Input placeholder="Parent&apos;s Name" />
                <div className="md:col-span-2 flex justify-end gap-3">
                  <Button type="button" variant="neutral">
                    Cancel
                  </Button>
                  <Button type="button">Update Student</Button>
                </div>
              </form>
            )}

            {activeSection === 'Details' && (
              <div className="grid gap-4 md:grid-cols-2">
                {['Roll No.', 'Name', 'Section', 'Email', 'Mobile No.', "Parent's Name"].map((item) => (
                  <div key={item} className="rounded-base border-2 border-border bg-secondary-background p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{item}</p>
                    <p className="mt-2 font-heading">Placeholder</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
