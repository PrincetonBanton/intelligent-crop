<template>
  <div class="block-view">
    <!-- 1. Header Section with Integrated Title, Badge, and Actions -->
    <div class="view-header">
      <div class="list-header">
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
        <div v-for="block in blocks" :key="block.id" :class="['block-card-circle', getCropTheme(block.primary_crop)]" @click="handleCardClick(block)">
          <button @click.stop="handleDelete(block)" class="btn-danger-icon" title="Delete Block">🗑️</button>
          
          <div class="circle-content">
            <strong class="block-code">{{ block.block_code }}</strong>
            <span class="crop-text">{{ block.primary_crop || 'General' }}</span>
            
            <div class="block-details-stack">
              <span class="detail-row"><b>Area:</b> {{ block.hectarage }} Ha</span>
              <span class="detail-row"><b>Trees:</b> {{ block.tree_count || 'N/A' }}</span>
              <span class="detail-row"><b>Status:</b> {{ block.status }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <AddBlockModal :show="showModal" :saving="saving" @close="showModal = false" @save="handleCreateBlock" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import AddBlockModal from '../components/modals/AddBlockModal.vue';
import { blockService } from '../services/blockService.js';
import { authService } from '../services/authService.js';
import { permissions, ROLES } from '../utils/permissions.js';

const props = defineProps({ farm: { type: Object, required: true } });
defineEmits(['back']);

const blocks = ref([]);
const loading = ref(true);
const saving = ref(false);
const showModal = ref(false);
const currentUser = ref(null);
const testRole = ref('owner');

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

function handleCardClick(block) {
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
.block-view{display:flex;flex-direction:column;gap:20px;text-align:left;background:#fff;}
.view-header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #f1f5f9;padding-bottom:12px}
.list-header{display:flex;align-items:center;gap:12px}
.list-header h2{margin:0;font-size:1.25rem;font-weight:700;color:#0f172a}
.badge{background:#ecfdf5;color:#047857;font-size:0.75rem;font-weight:700;padding:4px 10px;border-radius:12px}
.header-actions{display:flex;align-items:center;gap:10px}
.card{background:#fff;padding:0}
.btn-primary{padding:8px 14px;background:#16a34a;color:#fff;border:none;border-radius:8px;font-weight:600;font-size:0.85rem;cursor:pointer;display:flex;align-items:center;gap:4px;box-shadow:0 2px 4px rgba(22,163,74,0.2)}
.btn-primary:hover{background:#15803d}
.state-msg{color:#64748b;font-size:0.85rem;padding:24px 0;text-align:center}
.blocks-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:20px;align-items:center}
.block-card-circle{width:180px;height:180px;border-radius:50%;border:2px solid #64748b;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;text-align:center;position:relative;cursor:pointer;box-shadow:0 8px 20px -4px rgba(0,0,0,0.08);transition:all 0.25s ease;margin:0 auto}
.block-card-circle:hover{transform:translateY(-3px);border-color:#0f172a;box-shadow:0 15px 25px -8px rgba(0,0,0,0.15)}
.circle-content{display:flex;flex-direction:column;align-items:center;gap:2px;width:100%}

/* Solid black text details */
.block-code,.crop-text,.detail-row{color:#000000;text-shadow:0 1px 1px rgba(255,255,255,0.4)}
.block-code{font-size:1.05rem;font-weight:800;max-width:130px;overflow:visible;text-overflow:clip;word-break:break-word;line-height:1.2}
.crop-text{font-size:0.75rem;font-weight:600;max-width:130px;overflow:visible;text-overflow:clip;word-break:break-word;margin-bottom:2px}
.btn-danger-icon{position:absolute;top:28px;right:30px;background:#ffffff;border:1px solid #fecaca;color:#ef4444;width:24px;height:24px;border-radius:50%;font-size:0.75rem;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transition:all 0.2s;box-shadow:0 2px 5px rgba(0,0,0,0.05)}
.btn-danger-icon:hover{background:#fee2e2;transform:scale(1.1)}
.block-card-circle:hover .btn-danger-icon{opacity:1}

.block-details-stack{display:flex;flex-direction:column;gap:1px;background:transparent;padding:2px 10px;border-radius:0;font-size:0.7rem;width:130px;text-align:left;box-sizing:border-box}
.detail-row{overflow:visible;text-overflow:clip;word-break:break-word;line-height:1.2}

/* 6 Crop Theme Color Palettes */
.theme-green{background:linear-gradient(145deg,#f0fdf4,#dcfce7)}
.theme-yellow{background:linear-gradient(145deg,#fefce8,#fef08a)}
.theme-pink{background:linear-gradient(145deg,#fdf2f8,#fbcfe8)}
.theme-blue{background:linear-gradient(145deg,#eff6ff,#bfdbfe)}
.theme-purple{background:linear-gradient(145deg,#fdf4ff,#e9d5ff)}
.theme-amber{background:linear-gradient(145deg,#fffbeb,#fde68a)}

.role-switcher{display:flex;align-items:center;gap:6px;background:#f8fafc;padding:4px 8px;border-radius:8px;font-size:0.75rem;font-weight:600;color:#334155}
.role-dropdown{background:#fff;border:none;border-radius:6px;padding:4px 6px;font-size:0.75rem;font-weight:600;cursor:pointer;outline:none}
</style>