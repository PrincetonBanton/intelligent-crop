<template>
  <aside class="sidebar" :class="{ collapsed: isCollapsed }">
    <div class="sidebar-header">
      <button class="toggle-btn" @click="isCollapsed = !isCollapsed" :title="isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'">
        <span class="toggle-icon">{{ isCollapsed ? '›' : '‹' }}</span>
      </button>
    </div>

    <nav class="nav-menu">
      <a class="nav-item" :class="{ active: currentTab === 'dashboard' }" @click="$emit('update:currentTab', 'dashboard')" title="Dashboard">
        <span v-if="!isCollapsed" class="nav-label">Dashboard</span>
        <span v-else class="nav-initial">DB</span>
      </a>

      <a class="nav-item" :class="{ active: currentTab === 'farm-setup' }" @click="handleFarmSetupClick" title="Farm Setup">
        <span v-if="!isCollapsed" class="nav-label">Farm Setup</span>
        <span v-else class="nav-initial">FS</span>
      </a>

      <a class="nav-item" :class="{ active: currentTab === 'ipm-setup' }" @click="handleIpmSetupClick" title="IPM Inventory">
        <span v-if="!isCollapsed" class="nav-label">IPM Setup</span>
        <span v-else class="nav-initial">IP</span>
      </a>

      <a class="nav-item" :class="{ active: currentTab === 'crop-setup' }" @click="handleCropSetupClick" title="Crop Setup">
        <span v-if="!isCollapsed" class="nav-label">Crop Setup</span>
        <span v-else class="nav-initial">CS</span>
      </a>

      <a class="nav-item logout" @click="$emit('signOut')" title="Sign Out">
        <span v-if="!isCollapsed" class="nav-label">Sign Out</span>
        <span v-else class="nav-initial">SO</span>
      </a>
    </nav>
  </aside>
</template>

<script setup>
import { ref } from 'vue';
import { authService } from '../services/authService.js';
import { ROLES } from '../utils/permissions.js';

defineProps({
  currentTab: { type: String, required: true }
});

const emit = defineEmits(['update:currentTab', 'reset-farm', 'signOut']);
const isCollapsed = ref(false);

async function checkPermission() {
  try {
    const user = await authService.getCurrentUser() || { role: 'owner' };
    const role = (user.role || 'owner').toLowerCase();
    if (role === ROLES.OWNER || role === ROLES.MANAGER) {
      return true;
    } else {
      alert(`Role: ${role.toUpperCase()} — Not allowed (Restricted to Owners and Managers)`);
      return false;
    }
  } catch (err) {
    return true;
  }
}

async function handleFarmSetupClick() {
  if (await checkPermission()) {
    emit('reset-farm');
  }
}

async function handleIpmSetupClick() {
  if (await checkPermission()) {
    emit('update:currentTab', 'ipm-setup');
  }
}

async function handleCropSetupClick() {
  if (await checkPermission()) {
    emit('update:currentTab', 'crop-setup');
  }
}
</script>

<style scoped>
.sidebar{width:220px;background:#ffffff;padding:16px 12px;flex-shrink:0;display:flex;flex-direction:column;transition:width 0.2s cubic-bezier(0.4,0,0.2,1);overflow:hidden;white-space:nowrap;border-right:1px solid #f1f5f9;box-sizing:border-box}
.sidebar.collapsed{width:64px;padding:16px 8px}
.sidebar-header{display:flex;justify-content:flex-end;margin-bottom:20px}
.sidebar.collapsed .sidebar-header{justify-content:center}
.toggle-btn{background:#ffffff;border:1px solid #e2e8f0;color:#64748b;border-radius:6px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:0.9rem;transition:all 0.15s ease;box-shadow:0 1px 2px rgba(0,0,0,0.03)}
.toggle-btn:hover{background:#f8fafc;color:#0f172a;border-color:#cbd5e1}
.nav-menu{display:flex;flex-direction:column;gap:6px;height:100%}
.nav-item{display:flex;align-items:center;padding:9px 12px;border-radius:6px;font-size:0.825rem;color:#64748b;cursor:pointer;text-decoration:none;user-select:none;transition:all 0.15s ease;font-weight:normal;letter-spacing:0.01em;border-left:3px solid transparent}
.sidebar.collapsed .nav-item{justify-content:center;padding:9px 0}
.nav-item:hover{background:#f8fafc;color:#1e293b}
.nav-item.active{background:#f0fdf4;color:#15803d;font-weight:600;border-left-color:#16a34a}
.sidebar.collapsed .nav-item.active{border-left-color:#16a34a;background:#f0fdf4}
.nav-initial{font-size:0.75rem;letter-spacing:0.05em;text-transform:uppercase;color:#94a3b8;font-weight:normal}
.nav-item.active .nav-initial{color:#15803d;font-weight:600}
.nav-item.logout{color:#ef4444;margin-top:auto;font-weight:normal}
.nav-item.logout:hover{background:#fef2f2;color:#dc2626}
</style>