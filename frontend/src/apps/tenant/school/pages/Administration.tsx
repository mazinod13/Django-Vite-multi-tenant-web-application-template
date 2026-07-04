import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const items = ['Teachers', 'Staff', 'Users'] as const

export default function Administration() {
  const navigate = useNavigate()
  const [activeItem, setActiveItem] = useState<(typeof items)[number]>('Teachers')

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col gap-8">
        <header className="flex items-start justify-between">
          <div className="w-[160px]" />
          <div className="flex-1 space-y-3 text-center">
            <h1 className="text-4xl font-heading md:text-6xl">Administration</h1>
            <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground">System control hub</p>
          </div>
          <Button variant="neutral" onClick={() => navigate('/')}>
            Back to Dashboard
          </Button>
        </header>

        <div className="flex flex-wrap justify-center gap-3">
          {items.map((item) => (
            <Button
              key={item}
              variant={activeItem === item ? 'default' : 'neutral'}
              onClick={() => setActiveItem(item)}
            >
              {item}
            </Button>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{activeItem}</CardTitle>
            <CardDescription>Placeholder CRUD structure for the administration module.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-base border-2 border-dashed border-border bg-secondary-background p-6 text-sm text-muted-foreground md:col-span-2">
                {activeItem} section controls and related forms will live here.
              </div>

              <Input placeholder={`${activeItem} name`} />
              <Input placeholder="Email or username" />
              <Input placeholder="Role" />
              <Input placeholder="Status" />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="neutral">
                Cancel
              </Button>
              <Button type="button">Save {activeItem}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
