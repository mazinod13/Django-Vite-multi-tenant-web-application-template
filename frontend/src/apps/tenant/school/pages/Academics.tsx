import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const areas = ['Classes', 'Subjects', 'Timetable', 'Exams'] as const

export default function Academics() {
  const navigate = useNavigate()
  const [activeArea, setActiveArea] = useState<(typeof areas)[number]>('Classes')

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

        <Card>
          <CardHeader>
            <CardTitle>{activeArea}</CardTitle>
            <CardDescription>Placeholder CRUD structure for the academics module.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {activeArea === 'Classes' && (
              <div className="grid gap-4 md:grid-cols-2">
                <Input placeholder="Class name" />
                <Input placeholder="Section" />
                <div className="md:col-span-2 flex justify-end gap-3">
                  <Button type="button" variant="neutral">
                    Cancel
                  </Button>
                  <Button type="button">Save Class</Button>
                </div>
              </div>
            )}

            {activeArea === 'Subjects' && (
              <div className="grid gap-4 md:grid-cols-2">
                <Input placeholder="Subject name" />
                <Input placeholder="Subject code" />
                <div className="md:col-span-2 flex justify-end gap-3">
                  <Button type="button" variant="neutral">
                    Cancel
                  </Button>
                  <Button type="button">Save Subject</Button>
                </div>
              </div>
            )}

            {activeArea === 'Timetable' && (
              <div className="grid gap-4 md:grid-cols-2">
                <Input placeholder="Class" />
                <Input placeholder="Subject" />
                <Input placeholder="Day" />
                <Input placeholder="Time" />
                <div className="md:col-span-2 flex justify-end gap-3">
                  <Button type="button" variant="neutral">
                    Cancel
                  </Button>
                  <Button type="button">Save Timetable Entry</Button>
                </div>
              </div>
            )}

            {activeArea === 'Exams' && (
              <div className="grid gap-4 md:grid-cols-2">
                <Input placeholder="Exam name" />
                <Input placeholder="Class" />
                <Input placeholder="Date" />
                <Input placeholder="Duration" />
                <div className="md:col-span-2 flex justify-end gap-3">
                  <Button type="button" variant="neutral">
                    Cancel
                  </Button>
                  <Button type="button">Save Exam</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
