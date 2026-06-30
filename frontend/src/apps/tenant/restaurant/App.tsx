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
import { ListOrderedIcon, MenuIcon, TableIcon } from 'lucide-react'

type Props = { tenantName: string }

export default function App({ tenantName }: Props) {
  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="mb-6 text-2xl font-heading">{tenantName} - Restaurant Dashboard</h1>
      <nav className="flex gap-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button><MenuIcon />Menu</Button>
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

        <Button variant="neutral"><ListOrderedIcon />Orders</Button>
        <Button variant="reverse"><TableIcon />Tables</Button>
      </nav>
      <p className="mt-6 text-muted-foreground">Restaurant management interface.</p>
    </div>
  )
}
