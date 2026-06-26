<template>
    <div class="dashboard">
    <h1>{{  title  }} </h1>
    <p>This Vue component is served by Vite and mounted inside a Django template. 🎉</p>
    <button @click="count++">Clicked {{ count }} times</button>
    </div>
</template>

<script setup>
import { ref } from 'vue'
const title = ref('Tenant Dashboard')
const count = ref(0)
</script>

<style scoped>
.dashboard { font-family: system-ui, sans-serif; padding: 2rem; }
button { padding: .5rem 1rem; cursor: pointer; }
</style>