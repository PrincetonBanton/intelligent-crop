<template>
  <div class="block-view">
    <!-- 1. Header Section with Integrated Title, Badge, and Actions -->
    <div class="view-header">
      <div class="list-header">
        <button @click="$emit('back')" class="btn-back" title="Back to Farms">&larr; Back</button>
        <h2>{{ farm.name }} — Production Block Management</h2>
        <span class="badge" v-if="blocks.length > 0">{{ blocks.length }} Blocks Available</span>
      </div>
      <div class="header-actions">
        <div class="role-switcher">
          <button @click="onAddBlockClick" class="btn-primary"><span>+</span> Add Block</button>
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
      <div v-if="loading" class="state-msg">Loading blocks...</div>
      <div v-else-if="blocks.length === 0" class="state-msg empty">
        <p>No blocks configured for this farm yet.</p>
        <small>Click "Add Block" to partition this farm into manageable zones.</small>
      </div>

      <div v-else class="blocks-grid">
        <div 
          v-for="block in blocks" 
          :key="block.id" 
          :class="['block-card-container', getCropTheme(block.primary_crop)]" 
          @click="showBlockDetailsAlert(block)"
        >
          <button @click.stop="handleDelete(block)" class="btn-danger-icon" title="Delete Block">🗑️</button>

          <!-- Top Block Code & Crop Name Banner -->
          <div class="block-card-header">
            <span class="block-status-pill">{{ block.status || 'Active' }}</span>
            <strong class="block-code">{{ block.block_code }}</strong>
            <span class="crop-text">{{ block.primary_crop || 'General Crop' }}</span>
          </div>

          <!-- Structured Parameter Grid -->
          <div class="block-metrics-grid">
            <div class="metric-box">
              <span class="m-label">AREA</span>
              <span class="m-val">{{ block.hectarage }} <small>Ha</small></span>
            </div>
            <div class="metric-box">
              <span class="m-label">TREES</span>
              <span class="m-val">{{ block.tree_count || 0 }}</span>
            </div>
          </div>

          <!-- Footer Action Button -->
          <div class="block-footer-bar">
            <button @click.stop="openBlockTimeline(block)" class="btn-open-timeline" title="Open Timeline">
              Open Timeline &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>

    <AddBlockModal :show="showModal" :saving="saving" @close="showModal = false" @save="handleCreateBlock" />

    <!-- 3. Block Lifecycle Cycle Ruler Modal -->
    <CycleRulerModal 
      :isOpen="showTimelineModal" 
      :crop="selectedCropTemplate" 
      @close="showTimelineModal = false" 
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import AddBlockModal from '../components/modals/AddBlockModal.vue';
import CycleRulerModal from '../components/modals/CycleRulerModal.vue';
import { blockService } from '../services/blockService.js';
import { cropService } from '../services/cropService.js';
import { authService } from '../services/authService.js';
import { ROLES } from '../utils/permissions.js';

const props = defineProps({ farm: { type: Object, required: true } });
defineEmits(['back']);

const blocks = ref([]);
const loading = ref(true);
const saving = ref(false);
const showModal = ref(false);
const currentUser = ref(null);
const testRole = ref('owner');

// Timeline Modal State
const showTimelineModal = ref(false);
const selectedCropTemplate = ref(null);

// 6 crop-based color themes mapped dynamically by crop name string
const themes = ['theme-green', 'theme-yellow', 'theme-pink', 'theme-blue', 'theme-purple', 'theme-amber'];
function getCropTheme(cropName) {
  if (!cropName) return themes[0];
  let hash = 0;
  for (let i = 0; i < cropName.length; i++) {
    hash = cropName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return themes[Math.abs(hash) % themes.length];
}

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

async function onAddBlockClick() {
  if (!currentUser.value) currentUser.value = await authService.getCurrentUser() || { role: testRole.value };
  const role = currentUser.value.role;
  if (role !== ROLES.OWNER && role !== ROLES.MANAGER) {
    alert(`Access Denied (${role.toUpperCase()}) — Only Owners and Managers can add production blocks.`);
    return;
  }
  showModal.value = true;
}

async function loadBlocks() {
  loading.value = true;
  try {
    blocks.value = await blockService.getBlocksByFarm(props.farm.id);
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}

async function handleCreateBlock(blockData) {
  saving.value = true;
  try {
    const payload = { ...blockData, farm_id: props.farm.id };
    await blockService.createBlock(payload);
    showModal.value = false;
    await loadBlocks();
  } catch (err) {
    alert('Failed to save block: ' + err.message);
  } finally {
    saving.value = false;
  }
}

function showBlockDetailsAlert(block) {
  const details = [
    `🌱 Production Block Profile:`,
    `- Block Code: ${block.block_code}`,
    `- Primary Crop: ${block.primary_crop || 'N/A'}`,
    `- Hectarage: ${block.hectarage} Ha`,
    `- Tree Count: ${block.tree_count || 'N/A'}`,
    `- Operational Status: ${block.status}`
  ].join('\n');
  
  alert(details);
}

async function openBlockTimeline(block) {
  try {
    const templates = await cropService.getCropTemplates();
    const targetCropName = (block.primary_crop || '').trim().toLowerCase();
    const matchedTemplate = templates.find(
      t => (t.crop_name || '').trim().toLowerCase() === targetCropName
    );

    if (!matchedTemplate) {
      alert(`⚠️ No crop template found for "${block.primary_crop || 'this crop'}". Please create a template and configure its stages in "Crop Setup" before viewing the timeline.`);
      return;
    }

    selectedCropTemplate.value = matchedTemplate;
    showTimelineModal.value = true;
  } catch (err) {
    console.error('Failed to resolve block crop template:', err);
    alert('Could not load timeline for this block: ' + err.message);
  }
}

async function handleDelete(block) {
  if (!currentUser.value) currentUser.value = await authService.getCurrentUser() || { role: testRole.value };
  const role = currentUser.value.role;
  if (role !== ROLES.OWNER && role !== ROLES.MANAGER) {
    alert(`Access Denied (${role.toUpperCase()}) — Only Owners and Managers can delete blocks.`);
    return;
  }

  if (!confirm(`Are you sure you want to permanently delete production block "${block.block_code}"?`)) return;
  try {
    await blockService.deleteBlock(block.id);
    await loadBlocks();
  } catch (err) {
    alert('Failed to delete: ' + err.message);
  }
}

onMounted(async () => {
  await loadCurrentUser();
  await loadBlocks();
});
</script>

<style scoped>
.block-view{display:flex;flex-direction:column;gap:20px;text-align:left;background:#fff}
.view-header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #f1f5f9;padding-bottom:12px;flex-wrap:wrap;gap:12px}
.list-header{display:flex;align-items:center;gap:12px}
.list-header h2{margin:0;font-size:1.2rem;font-weight:700;color:#0f172a}
.btn-back{background:#f1f5f9;border:1px solid #cbd5e1;border-radius:6px;padding:4px 10px;font-size:0.8rem;font-weight:600;color:#475569;cursor:pointer;transition:all 0.15s}
.btn-back:hover{background:#e2e8f0;color:#0f172a}
.badge{background:#ecfdf5;color:#047857;font-size:0.75rem;font-weight:700;padding:4px 10px;border-radius:12px}
.header-actions,.role-switcher{display:flex;align-items:center;gap:10px}
.card{background:#fff;padding:0}
.btn-primary{padding:8px 14px;background:#16a34a;color:#fff;border:none;border-radius:8px;font-weight:600;font-size:0.85rem;cursor:pointer;display:flex;align-items:center;gap:4px;box-shadow:0 2px 4px rgba(22,163,74,0.2)}
.btn-primary:hover{background:#15803d}
.state-msg{color:#64748b;font-size:0.85rem;padding:24px 0;text-align:center}
.blocks-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:16px}
.block-card-container{background:#fff;border-radius:12px;border:1px solid #cbd5e1;padding:14px;display:flex;flex-direction:column;justify-content:space-between;position:relative;cursor:pointer;box-shadow:0 4px 12px -2px rgba(0,0,0,0.05);transition:all 0.2s ease;min-height:180px;box-sizing:border-box}
.block-card-container:hover{transform:translateY(-3px);border-color:#0f172a;box-shadow:0 10px 20px -5px rgba(0,0,0,0.12)}
.block-card-header{display:flex;flex-direction:column;gap:2px;align-items:flex-start}
.block-status-pill{font-size:0.625rem;font-weight:700;text-transform:uppercase;background:#0f172a;color:#fff;padding:2px 6px;border-radius:4px;margin-bottom:4px;letter-spacing:0.03em}
.block-code{font-size:1.15rem;font-weight:800;color:#0f172a;line-height:1.1}
.crop-text{font-size:0.775rem;font-weight:600;color:#475569}
.block-metrics-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px;padding:8px;background:rgba(255,255,255,0.7);border-radius:6px;border:1px solid rgba(0,0,0,0.06)}
.metric-box{display:flex;flex-direction:column}
.m-label{font-size:0.6rem;font-weight:700;color:#64748b;letter-spacing:0.04em}
.m-val{font-size:0.85rem;font-weight:700;color:#0f172a}
.m-val small{font-size:0.7rem;font-weight:500;color:#64748b}
.block-footer-bar{display:flex;justify-content:flex-end;margin-top:10px;border-top:1px dashed rgba(0,0,0,0.1);padding-top:8px}

/* Styled Button matching the crop simulator button */
.btn-open-timeline{background:#e0f2fe;color:#0284c7;border:1px solid #bae6fd;border-radius:6px;font-size:0.75rem;font-weight:700;padding:6px 10px;cursor:pointer;transition:all 0.2s;width:100%;text-align:center}
.btn-open-timeline:hover{background:#bae6fd;color:#0369a1}

.btn-danger-icon{position:absolute;top:10px;right:10px;background:#fff;border:1px solid #fecaca;color:#ef4444;width:24px;height:24px;border-radius:6px;font-size:0.75rem;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transition:all 0.2s;box-shadow:0 2px 4px rgba(0,0,0,0.05)}
.btn-danger-icon:hover{background:#fee2e2;transform:scale(1.08)}
.block-card-container:hover .btn-danger-icon{opacity:1}
.theme-green{background:linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%)}
.theme-yellow{background:linear-gradient(135deg,#fefce8 0%,#fef08a 100%)}
.theme-pink{background:linear-gradient(135deg,#fdf2f8 0%,#fbcfe8 100%)}
.theme-blue{background:linear-gradient(135deg,#eff6ff 0%,#bfdbfe 100%)}
.theme-purple{background:linear-gradient(135deg,#fdf4ff 0%,#e9d5ff 100%)}
.theme-amber{background:linear-gradient(135deg,#fffbeb 0%,#fde68a 100%)}
.role-switcher{background:#f8fafc;padding:4px 8px;border-radius:8px;font-size:0.75rem;font-weight:600;color:#334155}
.role-dropdown{background:#fff;border:none;border-radius:6px;padding:4px 6px;font-size:0.75rem;font-weight:600;cursor:pointer;outline:none}
</style>