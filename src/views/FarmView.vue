<template>
  <div class="farm-view">
    <!-- Switch between Farm Root View and Farm Block View -->
    <template v-if="!selectedFarm">
      <!-- 1. Header Section -->
      <div class="view-header">
        <div class="list-header">
          <h3>Registered Plantation Units</h3>
          <span class="badge" v-if="farms.length > 0">{{ farms.length }} Available</span>
        </div>
        <div class="header-actions">
          <div class="role-switcher">
            <button @click="onAddFarmClick" class="btn-primary"><span>+</span> Add Farm</button>
            <select v-model="testRole" @change="updateActiveRole" class="role-dropdown">
              <option value="owner">👑 Owner</option>
              <option value="manager">📊 Manager</option>
              <option value="supervisor">👷 Supervisor</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 2. Card Grid Section -->
      <div class="card list-card">
        <div v-if="loading" class="state-msg">Scanning database...</div>
        <div v-else-if="farms.length === 0" class="state-msg empty">
          <p>There is no farm configured.</p>
          <small>Click "Add Farm" to create your first root entity (e.g. B1, B2).</small>
        </div>

        <div v-else class="farms-grid">
          <div v-for="(farm, index) in farms" :key="farm.id" :class="['farm-card-circle', getThemeClass(index)]" @click="handleCardClick(farm)">
            <button @click.stop="handleDelete(farm)" class="btn-danger-icon" title="Delete Farm">🗑️</button>
            
            <div class="circle-content">
              <strong class="farm-name">{{ farm.name }}</strong>
              <span class="location-text">{{ farm.location || 'Region Unassigned' }}</span>
              
              <div class="farm-details-stack">
                <span class="detail-row"><b>Area:</b> {{ farm.total_hectarage }} Ha</span>
                <span class="detail-row"><b>Crop:</b> {{ farm.primary_crop || 'Multi-Crop' }}</span>
                <span class="detail-row"><b>Status:</b> Operational</span>
              </div>
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

// Exactly 6 distinct color themes
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
  const details = [
    `🏞️ Farm Enterprise Profile:`,
    `- Designation: ${farm.name}`,
    `- Region: ${farm.location || 'N/A'}`,
    `- Total Hectarage: ${farm.total_hectarage} Ha`,
    `- Primary Cultivation: ${farm.primary_crop || 'None'}`,
    `- Registration Timestamp: ${farm.created_at ? new Date(farm.created_at).toLocaleString() : 'N/A'}`
  ].join('\n');
  
  alert(details);
  selectedFarm.value = farm;
}

async function handleDelete(farm) {
  if (!currentUser.value) currentUser.value = await authService.getCurrentUser() || { role: testRole.value };
  if (!permissions.hasPermission(currentUser.value.role, ROLES.OWNER)) {
    alert(`Access Denied: Only Owners can delete farms.`);
    return;
  }
  if (!confirm(`Are you sure you want to permanently delete plantation unit "${farm.name}"? This action cannot be undone.`)) return;

  try {
    await farmService.deleteFarm(farm.id);
    await loadFarms();
  } catch (err) {
    alert('Failed to delete farm: ' + err.message);
  }
}

onMounted(async () => { await loadCurrentUser(); await loadFarms(); });
</script>

<style scoped>
.farm-view{display:flex;flex-direction:column;gap:20px;text-align:left;background:#fff}
.view-header,.list-header,.header-actions,.role-switcher{display:flex;justify-content:space-between;align-items:center}
.view-header{border-bottom:1px solid #f1f5f9;padding-bottom:12px}
.card{background:#fff;padding:0}.badge{background:#ecfdf5;color:#047857;font-size:0.75rem;font-weight:700;padding:4px 10px;border-radius:12px}
.btn-primary{padding:8px 14px;background:#16a34a;color:#fff;border:none;border-radius:8px;font-weight:600;font-size:0.85rem;cursor:pointer;display:flex;align-items:center;gap:4px;box-shadow:0 2px 4px rgba(22,163,74,0.2)}
.btn-primary:hover{background:#15803d}.state-msg{color:#64748b;font-size:0.85rem;padding:24px 0;text-align:center}
.farms-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:24px;align-items:center}
.farm-card-circle{width:300px;height:300px;border-radius:50%;border:2px solid #64748b;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:36px;text-align:center;position:relative;cursor:pointer;box-shadow:0 10px 25px -5px rgba(0,0,0,0.08);transition:all 0.25s ease;margin:0 auto}
.farm-card-circle:hover{transform:translateY(-4px);border-color:#0f172a;box-shadow:0 20px 30px -10px rgba(0,0,0,0.15)}
.circle-content{display:flex;flex-direction:column;align-items:center;gap:2px;width:100%}

/* All card text details set strictly to solid black */
.farm-name,.location-text,.detail-row{color:#000000;text-shadow:0 1px 1px rgba(255,255,255,0.4)}
.farm-name{font-size:1.3rem;font-weight:800;max-width:210px;overflow:visible;text-overflow:clip;word-break:break-word;line-height:1.2}
.location-text{font-size:0.85rem;font-weight:600;max-width:210px;overflow:visible;text-overflow:clip;word-break:break-word;margin-bottom:4px}
.btn-danger-icon{position:absolute;top:50px;right:52px;background:#ffffff;border:1px solid #fecaca;color:#ef4444;width:30px;height:30px;border-radius:50%;font-size:0.85rem;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transition:all 0.2s;box-shadow:0 2px 5px rgba(0,0,0,0.05)}
.btn-danger-icon:hover{background:#fee2e2;transform:scale(1.1)}
.farm-card-circle:hover .btn-danger-icon{opacity:1}

/* Inner dark background removed; transparent clean layout */
.farm-details-stack{display:flex;flex-direction:column;gap:2px;background:transparent;padding:4px 16px;border-radius:0;font-size:0.8rem;width:210px;text-align:left;box-sizing:border-box}
.detail-row{overflow:visible;text-overflow:clip;word-break:break-word;line-height:1.3}

/* 6 Streamlined Theme Color Palettes */
.theme-green{background:linear-gradient(145deg,#f0fdf4,#dcfce7)}
.theme-yellow{background:linear-gradient(145deg,#fefce8,#fef08a)}
.theme-pink{background:linear-gradient(145deg,#fdf2f8,#fbcfe8)}
.theme-blue{background:linear-gradient(145deg,#eff6ff,#bfdbfe)}
.theme-purple{background:linear-gradient(145deg,#fdf4ff,#e9d5ff)}
.theme-amber{background:linear-gradient(145deg,#fffbeb,#fde68a)}

.role-switcher{gap:6px;background:#f8fafc;padding:4px 8px;border-radius:8px;font-size:0.75rem;font-weight:600;color:#334155}
.role-dropdown{background:#fff;border:none;border-radius:6px;padding:4px 6px;font-size:0.75rem;font-weight:600;cursor:pointer;outline:none}
</style>