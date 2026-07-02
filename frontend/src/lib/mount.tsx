import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'

import AuthGate from '@/components/AuthGate'
import '@/styles/globals.css'

type Options = { gated?: boolean }

// Mounts a React tree into #app.
// By default it wraps the tree in <AuthGate>; pass { gated: false }
// for public pages (e.g. password reset) that must render without auth.
export function mount(
  render: (props: { tenantName: string }) => ReactNode,
  { gated = true }: Options = {},
) {
  const el = document.getElementById('app')!
  const content = render({ tenantName: el.dataset.tenant ?? '' })
  createRoot(el).render(gated ? <AuthGate>{content}</AuthGate> : content)
}
