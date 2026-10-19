<template>
  <div class="farm-view">
    <!-- Switch between Farm Root View and Farm Block View -->
    <template v-if="!selectedFarm">
      <!-- Header Section -->
      <div class="view-header">
        <div class="list-header">
          <h3>Registered Plantation Units</h3>
          <span class="badge" v-if="farms.length > 0">{{ farms.length }} Active</span>
        </div>
        <div class="header-actions">
          <div class="role-switcher">
            <span class="role-label">Role:</span>
            <select v-model="testRole" @change="updateActiveRole" class="role-dropdown">
              <option value="owner">👑 Owner</option>
              <option value="manager">📊 Manager</option>
              <option value="supervisor">👷 Supervisor</option>
            </select>
          </div>
          <button @click="onAddFarmClick" class="btn-primary">+ Add Farm</button>
        </div>
      </div>

      <!-- Card Grid Section -->
      <div class="card-container">
        <div v-if="loading" class="state-msg">Scanning database...</div>
        
        <div v-else-if="farms.length === 0" class="state-msg empty">
          <p class="empty-title">There is no farm configured.</p>
          <small>Click "Add Farm" to create your first root entity.</small>
        </div>

        <div v-else class="farms-grid">
          <div 
            v-for="(farm, index) in farms" 
            :key="farm.id" 
            :class="['farm-profile-card', getThemeClass(index)]"
          >
            <!-- Clickable Card Body -->
            <div class="card-main-trigger" @click="handleCardClick(farm)">
              <!-- Top Accent Banner with Title and Location -->
              <div class="card-banner">
                <div class="banner-title-group">
                  <h4 class="farm-name" :title="farm.name">{{ farm.name }}</h4>
                  <span class="location-text">{{ farm.location || 'Region Unassigned' }}</span>
                </div>
              </div>

              <!-- Profile Details Stack -->
              <div class="profile-body">
                <div class="metric-item">
                  <span class="metric-label">Area</span>
                  <span class="metric-value"><b>{{ farm.total_hectarage || 0 }}</b> Ha</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">Crop</span>
                  <span class="metric-value">{{ farm.primary_crop || 'Multi-Crop' }}</span>
                </div>
              </div>
            </div>

            <!-- Card Footer Link -->
            <div class="card-footer" @click="selectedFarm = farm">
              <span class="view-link">Explore Blocks &rarr;</span>
            </div>
          </div>
        </div>
      </div>

      <AddFarmModal :show="showModal" :saving="saving" @close="showModal = false" @save="handleCreateFarm" />
    </template>

    <!-- Drill-down view into Blocks -->
    <FarmBlockView v-else :farm="selectedFarm" @back="selectedFarm = null" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import AddFarmModal from '../components/modals/AddFarmModal.vue';
import FarmBlockView from './FarmBlockView.vue';
import { farmService } from '../services/farmService.js';
import { authService } from '../services/authService.js';
import { permissions, ROLES } from '../utils/permissions.js';

const farms = ref([]);
const loading = ref(true);
const saving = ref(false);
const showModal = ref(false);
const currentUser = ref(null);
const testRole = ref('owner');
const selectedFarm = ref(null);

const themes = ['theme-green', 'theme-yellow', 'theme-pink', 'theme-blue', 'theme-purple', 'theme-amber'];
function getThemeClass(index) { return themes[index % themes.length]; }

function resetView() { selectedFarm.value = null; }
defineExpose({ resetView });

async function loadCurrentUser() {
  try {
    currentUser.value = await authService.getCurrentUser();
    if (currentUser.value?.role) testRole.value = currentUser.value.role;
  } catch (err) { console.error(err); }
}

function updateActiveRole() {
  if (currentUser.value) currentUser.value.role = testRole.value;
  else currentUser.value = { role: testRole.value, email: 'simulator@test.com' };
}

async function onAddFarmClick() {
  if (!currentUser.value) currentUser.value = await authService.getCurrentUser() || { role: testRole.value };
  if (!permissions.hasPermission(currentUser.value.role, ROLES.OWNER)) {
    alert(`Access Denied (${currentUser.value.role.toUpperCase()}): Only Owners can create farms.`);
    return;
  }
  showModal.value = true;
}

async function loadFarms() {
  loading.value = true;
  try { farms.value = await farmService.getFarms(); }
  catch (err) { console.error(err); }
  finally { loading.value = false; }
}

async function handleCreateFarm(formData) {
  saving.value = true;
  try {
    await farmService.createFarm(formData, currentUser.value);
    showModal.value = false;
    await loadFarms();
  } catch (err) { alert('Failed to save: ' + err.message); }
  finally { saving.value = false; }
}

function handleCardClick(farm) {
  alert('FarmViewModal ayaw kalimot edit delete');
}

onMounted(async () => { await loadCurrentUser(); await loadFarms(); });
</script>

<style scoped>
/* Main Layout & Header */
.farm-view { display: flex; flex-direction: column; gap: 20px; text-align: left; background: #f8fafc; padding: 20px; border-radius: 12px; }
.view-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; flex-wrap: wrap; gap: 12px; }
.list-header, .header-actions, .role-switcher { display: flex; align-items: center; gap: 8px; }
.list-header h3 { margin: 0; font-size: 1.15rem; color: #0f172a; font-weight: 700; }
.badge { background: #ecfdf5; color: #047857; font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 30px; border: 1px solid #a7f3d0; }
.role-switcher { background: #fff; padding: 4px 10px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 0.75rem; color: #475569; font-weight: 600; }
.role-dropdown { background: transparent; border: none; font-size: 0.75rem; font-weight: 600; cursor: pointer; outline: none; }
.btn-primary { padding: 8px 14px; background: #16a34a; color: #fff; border: none; border-radius: 6px; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: background 0.2s; }
.btn-primary:hover { background: #15803d; }

/* Grid & Cards */
.farms-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.farm-profile-card { background: #fff; border-radius: 10px; border: 1px solid #e2e8f0; overflow: hidden; display: flex; flex-direction: column; transition: transform 0.2s, box-shadow 0.2s; }
.farm-profile-card:hover { transform: translateY(-2px); box-shadow: 0 8px 16px -4px rgba(0,0,0,0.06); border-color: #cbd5e1; }

.card-main-trigger { cursor: pointer; display: flex; flex-direction: column; }

/* Banner Section with Details */
.card-banner { padding: 12px 14px; display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
.banner-title-group { display: flex; flex-direction: column; min-width: 0; width: 100%; }
.farm-name { font-size: 0.95rem; font-weight: 700; color: #0f172a; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.location-text { font-size: 0.75rem; color: #475569; margin-top: 2px; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Card Content Sections */
.profile-body { padding: 10px 14px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #f8fafc; border-top: 1px solid rgba(0, 0, 0, 0.05); border-bottom: 1px solid #f1f5f9; }
.metric-item { display: flex; flex-direction: column; }
.metric-label { font-size: 0.65rem; color: #64748b; font-weight: 600; text-transform: uppercase; }
.metric-value { font-size: 0.85rem; color: #1e293b; font-weight: 600; margin-top: 2px; }
.card-footer { padding: 8px 14px; text-align: right; background: #fff; margin-top: auto; cursor: pointer; }
.card-footer:hover .view-link { text-decoration: underline; }
.view-link { font-size: 0.75rem; font-weight: 600; color: #16a34a; }

/* Color Banners */
.theme-green .card-banner { background: #dcfce7; }
.theme-yellow .card-banner { background: #fef08a; }
.theme-pink .card-banner { background: #fbcfe8; }
.theme-blue .card-banner { background: #bfdbfe; }
.theme-purple .card-banner { background: #e9d5ff; }
.theme-amber .card-banner { background: #fde68a; }

/* Empty & Loading States */
.state-msg { color: #64748b; font-size: 0.85rem; padding: 40px 0; text-align: center; }
.empty-title { font-size: 0.95rem; font-weight: 600; color: #334155; margin: 0 0 4px; }
</style>