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
        <p class="toggle-text">
          {{ isSignUp ? 'Already registered?' : 'Need an account?' }}
          <a @click="isSignUp = !isSignUp">{{ isSignUp ? 'Sign In' : 'Sign Up' }}</a>
        </p>
      </div>
    </div>

    <!-- Authenticated Dashboard Workspace -->
    <div v-else class="main-container">
      <aside class="sidebar">
        <nav class="nav-menu">
          <a 
            class="nav-item" 
            :class="{ active: currentTab === 'dashboard' }" 
            @click="currentTab = 'dashboard'"
          >
            Dashboard
          </a>
          <a 
            class="nav-item" 
            :class="{ active: currentTab === 'farm-setup' }" 
            @click="currentTab = 'farm-setup'"
          >
            Farm Setup
          </a>
          <a 
            class="nav-item" 
            :class="{ active: currentTab === 'supervisors' }" 
            @click="currentTab = 'supervisors'"
          >
            Supervisors
          </a>
          <a 
            class="nav-item" 
            :class="{ active: currentTab === 'blocks' }" 
            @click="currentTab = 'blocks'"
          >
            Blocks
          </a>
          <a @click="handleSignOut" class="nav-item logout">Sign Out</a>
        </nav>
      </aside>

      <main class="workspace">
        <!-- Dashboard View -->
        <div v-if="currentTab === 'dashboard'" class="tab-view">
          <h2>Dashboard</h2>
        </div>

        <!-- Farm Setup View -->
        <div v-else-if="currentTab === 'farm-setup'" class="tab-view">
          <div class="workspace-header">
            <h2>1. Farm Setup</h2>
          </div>

          <div class="form-container">
            <form @submit.prevent="handleSaveFarm" class="farm-form">
              <div class="form-group">
                <label>Farm Name</label>
                <input v-model="farmForm.name" placeholder="e.g. Central Plantation" required />
              </div>
              <div class="form-group">
                <label>Location</label>
                <input v-model="farmForm.location" placeholder="e.g. Davao City" required />
              </div>
              <div class="form-group">
                <label>Total Hectarage (Ha)</label>
                <input v-model="farmForm.total_hectarage" type="number" step="0.01" placeholder="e.g. 25.5" required />
              </div>
              <div class="form-group">
                <label>Primary Crop</label>
                <input v-model="farmForm.primary_crop" placeholder="e.g. Pomelo" required />
              </div>
              <button type="submit" :disabled="saving" class="btn-primary">
                {{ saving ? 'Saving...' : 'Save Farm Entity' }}
              </button>
            </form>

            <div class="list-container">
              <h3>Registered Farms</h3>
              <ul v-if="farms.length > 0" class="farm-list">
                <li v-for="f in farms" :key="f.id" class="farm-item">
                  <strong>{{ f.name }}</strong> ({{ f.primary_crop }})
                  <span>{{ f.location }} • {{ f.total_hectarage }} Ha</span>
                </li>
              </ul>
              <p v-else class="empty-msg">No farms registered yet.</p>
            </div>
          </div>
        </div>

        <!-- Supervisors View -->
        <div v-else-if="currentTab === 'supervisors'" class="tab-view">
          <h2>Supervisors</h2>
        </div>

        <!-- Blocks View -->
        <div v-else-if="currentTab === 'blocks'" class="tab-view">
          <h2>Blocks</h2>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { authService } from '../services/authService.js';
import { farmService } from '../services/farmService.js';

const currentUser = ref(null);
const email = ref('');
const password = ref('');
const isSignUp = ref(false);
const loading = ref(false);

const currentTab = ref('dashboard');

const saving = ref(false);
const farms = ref([]);
const farmForm = ref({ name: '', location: '', total_hectarage: '', primary_crop: '' });

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

async function handleSaveFarm() {
  saving.value = true;
  try {
    await farmService.createFarm(farmForm.value, currentUser.value.id);
    farmForm.value = { name: '', location: '', total_hectarage: '', primary_crop: '' };
    await loadFarms();
  } catch (err) {
    alert('Error saving farm: ' + err.message);
  } finally {
    saving.value = false;
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
.topbar { height: 56px; background: #ffffff; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; flex-shrink: 0; }
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
.auth-card { width: 340px; padding: 28px; background: #ffffff; border-radius: 8px; border: 1px solid #cbd5e1; display: flex; flex-direction: column; gap: 16px; }
.auth-card h3 { margin: 0; font-size: 1.2rem; color: #0f172a; }
.form-group { display: flex; flex-direction: column; gap: 4px; }
.form-group label { font-size: 0.8rem; font-weight: 600; color: #475569; }
.form-group input { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.875rem; }
.btn-primary { padding: 10px; background: #16a34a; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; margin-top: 8px; }
.btn-primary:hover { background: #15803d; }
.toggle-text { font-size: 0.8rem; color: #64748b; margin: 0; text-align: center; }
.toggle-text a { color: #16a34a; font-weight: 600; cursor: pointer; text-decoration: underline; }
.main-container { display: flex; flex: 1; overflow: hidden; }
.sidebar { width: 220px; background: #ffffff; border-right: 1px solid #e2e8f0; padding: 16px 12px; flex-shrink: 0; display: flex; flex-direction: column; justify-content: space-between; }
.nav-menu { display: flex; flex-direction: column; gap: 4px; }
.nav-item { padding: 10px 12px; border-radius: 6px; font-size: 0.875rem; font-weight: 500; color: #64748b; cursor: pointer; text-decoration: none; }
.nav-item:hover, .nav-item.active { background: #f1f5f9; color: #0f172a; font-weight: 600; }
.nav-item.logout { color: #dc2626; margin-top: auto; }
.workspace { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }
.tab-view { display: flex; flex-direction: column; gap: 16px; }
.tab-view h2 { margin: 0; font-size: 1.25rem; font-weight: 700; color: #1e293b; text-align: left; }
.workspace-header h2 { margin: 0; font-size: 1.25rem; font-weight: 700; color: #1e293b; text-align: left; }
.form-container { display: grid; grid-template-columns: 320px 1fr; gap: 24px; background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
.farm-form { display: flex; flex-direction: column; gap: 12px; }
.list-container h3 { margin: 0 0 12px 0; font-size: 1rem; color: #1e293b; }
.farm-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.farm-item { padding: 12px; border: 1px solid #e2e8f0; border-radius: 6px; display: flex; flex-direction: column; font-size: 0.875rem; background: #f8fafc; }
.farm-item span { font-size: 0.75rem; color: #64748b; margin-top: 2px; }
.empty-msg { color: #94a3b8; font-size: 0.875rem; }
</style>