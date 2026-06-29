<template>
  <div class="dashboard restaurant">
    <h1>{{ tenantName }} — Restaurant Dashboard</h1>
    <nav>
      <button>Menu</button>
      <button>Orders</button>
      <button>Tables</button>
    </nav>
    <p>Restaurant management interface.</p>
  </div>
</template>

<script setup>
defineProps({ tenantName: String })
</script>

<style scoped>
.restaurant { font-family: system-ui, sans-serif; padding: 2rem; }
.restaurant h1 { color: #c2410c; }
nav button { margin-right: .5rem; padding: .5rem 1rem; cursor: pointer; }
</style>
