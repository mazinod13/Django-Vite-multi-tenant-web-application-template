import { createApp } from 'vue'
import App from './App.vue'

const el = document.getElementById('app')
createApp(App, { tenantName: el.dataset.tenant }).mount(el)
