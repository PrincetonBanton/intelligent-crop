<template>
  <div class="app-layout">
    <!-- Top Bar -->
    <header class="topbar">
      <div class="brand-zone">
        <div class="logo-box">IC</div>
        <span class="app-title">INTELLIGENT CROP</span>
      </div>
      <div class="status-badge" :class="currentUser ? 'online' : 'offline'">
        <span class="dot"></span>
        <span>{{ currentUser ? currentUser.email : 'Unauthenticated' }}</span>
      </div>
    </header>

    <!-- Unauthenticated View -->
    <div v-if="!currentUser" class="auth-container">
      <div class="auth-card">
        <h3>{{ isSignUp ? 'Create Account' : 'Sign In' }}</h3>
        <form @submit.prevent="handleAuth">
          <div class="form-group">
            <label>Email Address</label>
            <input v-model="email" type="email" placeholder="manager@intelligentcrop.com" required />
          </div>
          <div class="form-group">
            <label>Password</label>
            <input v-model="password" type="password" placeholder="••••••••" required />
          </div>
          <button type="submit" :disabled="loading" class="btn-primary">
            {{ loading ? 'Authenticating...' : (isSignUp ? 'Sign Up' : 'Sign In') }}
          </button>
        </form>

        <!-- Test System Bypass Button -->
        <button type="button" @click="handleTestBypass" class="btn-secondary">
          View Testing
        </button>

        <p class="toggle-text">
          {{ isSignUp ? 'Already registered?' : 'Need an account?' }}
          <a @click="isSignUp = !isSignUp">{{ isSignUp ? 'Sign In' : 'Sign Up' }}</a>
        </p>
      </div>
    </div>

    <!-- Authenticated Mainhub Workspace -->
    <div v-else class="main-container">
      <SidebarNav 
        :currentTab="currentTab" 
        @update:currentTab="currentTab = $event"
        @reset-farm="handleResetFarm"
        @signOut="handleSignOut" 
      />

      <main class="workspace">
        <DashboardView v-if="currentTab === 'dashboard'" />
        <FarmView ref="farmViewRef" v-else-if="currentTab === 'farm-setup'" />
        <IPMView v-else-if="currentTab === 'ipm-setup'" />
        <CropView v-else-if="currentTab === 'crop-setup'" />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import SidebarNav from '../components/SidebarNav.vue';
import DashboardView from './DashboardView.vue';
import FarmView from './FarmView.vue';
import IPMView from './IPMView.vue';
import CropView from './CropView.vue';
import { authService } from '../services/authService.js';
import { farmService } from '../services/farmService.js';

const currentUser = ref(null);
const email = ref('');
const password = ref('');
const isSignUp = ref(false);
const loading = ref(false);
const currentTab = ref('dashboard');
const farms = ref([]);
const farmViewRef = ref(null);

async function checkSession() {
  try {
    const session = await authService.getSession();
    currentUser.value = session?.user || null;
    if (currentUser.value) loadFarms();
  } catch (err) {
    console.error('Session check error:', err.message);
  }
}

async function loadFarms() {
  try {
    farms.value = await farmService.getFarms();
  } catch (err) {
    console.error('Failed to load farms:', err.message);
  }
}

function handleResetFarm() {
  currentTab.value = 'farm-setup';
  if (farmViewRef.value && typeof farmViewRef.value.resetView === 'function') {
    farmViewRef.value.resetView();
  }
}

async function handleAuth() {
  loading.value = true;
  try {
    if (isSignUp.value) {
      await authService.signUp(email.value, password.value);
      alert('Account created! Please sign in.');
      isSignUp.value = false;
    } else {
      const res = await authService.signIn(email.value, password.value);
      currentUser.value = res.user;
      loadFarms();
    }
  } catch (err) {
    alert('Auth Error: ' + err.message);
  } finally {
    loading.value = false;
  }
}

function handleTestBypass() {
  currentUser.value = { id: 'test-bypass-id', email: 'tester@intelligentcrop.com', role: 'owner' };
  loadFarms();
}

async function handleSignOut() {
  await authService.signOut();
  currentUser.value = null;
  farms.value = [];
  currentTab.value = 'dashboard';
}

onMounted(() => {
  checkSession();
  authService.onAuthStateChange((_event, session) => {
    currentUser.value = session?.user || null;
    if (currentUser.value) loadFarms();
  });
});
</script>

<style scoped>
.app-layout { display: flex; flex-direction: column; height: 100vh; width: 100vw; overflow: hidden; background: #f8fafc; color: #0f172a; }
.topbar { height: 56px; background: #fff; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; flex-shrink: 0; }
.brand-zone { display: flex; align-items: center; gap: 12px; }
.logo-box { width: 32px; height: 32px; background: #16a34a; color: #fff; font-weight: 800; font-size: 0.85rem; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
.app-title { font-weight: 800; font-size: 1.1rem; letter-spacing: -0.02em; }
.status-badge { display: flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 16px; font-size: 0.75rem; font-weight: 600; }
.status-badge.online { background: #ecfdf5; border: 1px solid #a7f3d0; color: #047857; }
.status-badge.offline { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
.dot { width: 8px; height: 8px; border-radius: 50%; }
.online .dot { background: #10b981; }
.offline .dot { background: #ef4444; }
.auth-container { flex: 1; display: flex; align-items: center; justify-content: center; background: #f1f5f9; }
.auth-card { width: 340px; padding: 28px; background: #fff; border-radius: 8px; border: 1px solid #cbd5e1; display: flex; flex-direction: column; gap: 16px; box-sizing: border-box; }
.auth-card h3 { margin: 0; font-size: 1.2rem; color: #0f172a; }
.form-group { display: flex; flex-direction: column; gap: 4px; width: 100%; }
.form-group label { font-size: 0.8rem; font-weight: 600; color: #475569; }
.form-group input { width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.875rem; box-sizing: border-box; outline: none; }
.form-group input:focus { border-color: #16a34a; }
.btn-primary { width: 100%; padding: 10px; background: #16a34a; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; margin-top: 8px; box-sizing: border-box; }
.btn-primary:hover { background: #15803d; }
.btn-secondary { width: 100%; padding: 9px; background: #f8fafc; color: #334155; border: 1px solid #cbd5e1; border-radius: 6px; font-weight: 600; cursor: pointer; box-sizing: border-box; font-size: 0.85rem; }
.btn-secondary:hover { background: #f1f5f9; border-color: #94a3b8; }
.toggle-text { font-size: 0.8rem; color: #64748b; margin: 0; text-align: center; }
.toggle-text a { color: #16a34a; font-weight: 600; cursor: pointer; text-decoration: underline; }
.main-container { display: flex; flex: 1; overflow: hidden; }
.workspace { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }
</style>