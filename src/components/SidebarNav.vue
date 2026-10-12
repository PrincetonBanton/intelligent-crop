<template>
  <aside class="sidebar" :class="{ collapsed: isCollapsed }">
    <div class="sidebar-header">
      <button class="toggle-btn" @click="isCollapsed = !isCollapsed" :title="isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'">
        <span class="toggle-icon">{{ isCollapsed ? '❯' : '❮' }}</span>
      </button>
    </div>

    <nav class="nav-menu">
      <a class="nav-item" :class="{ active: currentTab === 'dashboard' }" @click="$emit('update:currentTab', 'dashboard')" title="Dashboard">
        <span class="nav-icon">📊</span>
        <span v-if="!isCollapsed" class="nav-label">Dashboard</span>
      </a>

      <a class="nav-item" :class="{ active: currentTab === 'farm-setup' }" @click="$emit('reset-farm')" title="Farm Setup">
        <span class="nav-icon">🌱</span>
        <span v-if="!isCollapsed" class="nav-label">Farm Setup</span>
      </a>

      <a class="nav-item logout" @click="$emit('signOut')" title="Sign Out">
        <span class="nav-icon">🚪</span>
        <span v-if="!isCollapsed" class="nav-label">Sign Out</span>
      </a>
    </nav>
  </aside>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  currentTab: { type: String, required: true }
});

defineEmits(['update:currentTab', 'reset-farm', 'signOut']);

const isCollapsed = ref(false);
</script>

<style scoped>
.sidebar { width: 220px; background: #fff; padding: 12px; flex-shrink: 0; display: flex; flex-direction: column; transition: width 0.25s ease; overflow: hidden; white-space: nowrap; }
.sidebar.collapsed { width: 64px; }
.sidebar-header { display: flex; justify-content: flex-end; margin-bottom: 12px; }
.sidebar.collapsed .sidebar-header { justify-content: center; }
.toggle-btn { background: #f1f5f9; border: 1px solid #cbd5e1; color: #475569; border-radius: 6px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.75rem; }
.toggle-btn:hover { background: #e2e8f0; color: #0f172a; }
.nav-menu { display: flex; flex-direction: column; gap: 4px; height: 100%; }
.nav-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 6px; font-size: 0.875rem; font-weight: 500; color: #64748b; cursor: pointer; text-decoration: none; user-select: none; }
.sidebar.collapsed .nav-item { justify-content: center; padding: 10px 0; }
.nav-item:hover, .nav-item.active { background: #f1f5f9; color: #0f172a; font-weight: 600; }
.nav-icon { font-size: 1.1rem; display: flex; align-items: center; justify-content: center; }
.nav-item.logout { color: #dc2626; margin-top: auto; }
</style>