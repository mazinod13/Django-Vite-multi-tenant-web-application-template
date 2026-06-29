<template>
    <div class="dashboard school">
        <h1>{{ tenantName }} - School Dashboard</h1>
        <nav>
            <button>Students</button>
            <button>Classrooms</button> 
            <button>Attendance</button>
        </nav>
        <p>School Management interface</p>
    </div>
</template>

<script setup>
defineProps({ tenantName:String})
</script>

<style scoped>
.school { font-family: system-ui, sans-serif; padding: 2rem; }
.school h1 { color: #2563eb; }
nav button { margin-right: .5rem; padding: .5rem 1rem; cursor: pointer; }
</style>