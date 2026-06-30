import { mount } from '@/lib/mount'
import App from './App'

mount(({ tenantName }) => <App tenantName={tenantName} />)
