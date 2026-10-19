<template>
  <div class="dashboard-view">
    <!-- View Header with Farm Selector Dropdown -->
    <div class="view-header">
      <div class="list-header">
        <select v-model="selectedFarmId" @change="onFarmChange" class="farm-dropdown-main">
          <option value="" disabled>-- Select Plantation Unit --</option>
          <option v-for="farm in farms" :key="farm.id" :value="farm.id">
            {{ farm.name }} ({{ farm.location || 'No Location' }})
          </option>
        </select>
        <span class="badge" v-if="blocks.length > 0">{{ blocks.length }} Blocks Available</span>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="card list-card">
      <div v-if="loadingFarms || loadingBlocks" class="state-msg">Loading block partitions...</div>
      <div v-else-if="!selectedFarm" class="state-msg empty">
        <p>Please select a plantation unit above.</p>
        <small>Inspect active operational blocks across your farms.</small>
      </div>
      <div v-else-if="blocks.length === 0" class="state-msg empty">
        <p>No blocks configured for {{ selectedFarm.name }} yet.</p>
        <small>Add blocks under Farm Setup to populate this view.</small>
      </div>

      <div v-else class="dashboard-content">
        <!-- Compact Mini Block Grid Section -->
        <div class="blocks-grid-mini">
          <div 
            v-for="block in blocks" 
            :key="block.id" 
            :class="['block-card-mini', getCropTheme(block.primary_crop)]" 
            @click="handleCardClick(block)"
          >
            <div class="mini-card-top">
              <strong class="block-code">{{ block.block_code }}</strong>
              <span class="block-status-dot" :title="block.status || 'Active'"></span>
            </div>
            <span class="crop-text">{{ block.primary_crop || 'General' }}</span>
            <div class="mini-metrics">
              <span>{{ block.hectarage }} Ha</span>
              <span>•</span>
              <span>{{ block.tree_count || 0 }} trees</span>
            </div>
          </div>
        </div>

        <!-- Placeholder Section Reserved for Charts & Visualizations -->
        <!-- Future components like <FarmMetricsChart />, <YieldAnalytics /> will attach here -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { farmService } from '../services/farmService.js';
import { blockService } from '../services/blockService.js';

const farms = ref([]);
const blocks = ref([]);
const selectedFarmId = ref('');
const selectedFarm = ref(null);
const loadingFarms = ref(true);
const loadingBlocks = ref(false);

const themes = ['theme-green', 'theme-yellow', 'theme-pink', 'theme-blue', 'theme-purple', 'theme-amber'];
function getCropTheme(cropName) {
  if (!cropName) return themes[0];
  let hash = 0;
  for (let i = 0; i < cropName.length; i++) {
    hash = cropName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return themes[Math.abs(hash) % themes.length];
}

async function loadFarms() {
  loadingFarms.value = true;
  try {
    const data = await farmService.getFarms();
    farms.value = data || [];
    if (farms.value.length > 0) {
      selectedFarmId.value = farms.value[0].id;
      selectedFarm.value = farms.value[0];
      await loadBlocksForFarm(selectedFarmId.value);
    }
  } catch (err) {
    console.error(err);
  } finally {
    loadingFarms.value = false;
  }
}

async function onFarmChange() {
  selectedFarm.value = farms.value.find(f => f.id === selectedFarmId.value) || null;
  if (selectedFarmId.value) {
    await loadBlocksForFarm(selectedFarmId.value);
  } else {
    blocks.value = [];
  }
}

async function loadBlocksForFarm(farmId) {
  loadingBlocks.value = true;
  try {
    blocks.value = await blockService.getBlocksByFarm(farmId);
  } catch (err) {
    console.error(err);
    blocks.value = [];
  } finally {
    loadingBlocks.value = false;
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

onMounted(loadFarms);
</script>

<style scoped>
.dashboard-view{display:flex;flex-direction:column;gap:16px;text-align:left;background:#fff;margin:0;padding:0}
.view-header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #f1f5f9;padding-bottom:12px;margin:0;background:#fff}
.list-header{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.list-header h2{margin:0;font-size:1.25rem;font-weight:700;color:#0f172a}
.farm-dropdown-main{padding:6px 12px;border:1px solid #cbd5e1;border-radius:6px;font-size:0.85rem;font-weight:600;background:#fff;color:#0f172a;cursor:pointer}
.badge{background:#ecfdf5;color:#047857;font-size:0.75rem;font-weight:700;padding:4px 10px;border-radius:12px}
.card{background:#fff;padding:0;margin:0;border:none}
.state-msg{color:#64748b;font-size:0.85rem;padding:24px 0;text-align:center}
.dashboard-content{display:flex;flex-direction:column;gap:20px}
.blocks-grid-mini{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px}
.block-card-mini{background:#fff;border-radius:8px;border:1px solid #cbd5e1;padding:8px 10px;display:flex;flex-direction:column;gap:2px;cursor:pointer;transition:all 0.15s ease;box-sizing:border-box}
.block-card-mini:hover{transform:translateY(-2px);border-color:#0f172a;box-shadow:0 4px 10px -2px rgba(0,0,0,0.08)}
.mini-card-top{display:flex;justify-content:space-between;align-items:center}
.block-code{font-size:0.8rem;font-weight:800;color:#0f172a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.block-status-dot{width:6px;height:6px;background:#16a34a;border-radius:50%}
.crop-text{font-size:0.7rem;font-weight:600;color:#475569;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mini-metrics{font-size:0.65rem;color:#64748b;font-weight:500;display:flex;gap:4px;align-items:center}
.theme-green{background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-color:#bbf7d0}
.theme-yellow{background:linear-gradient(135deg,#fefce8,#fef08a);border-color:#fde047}
.theme-pink{background:linear-gradient(135deg,#fdf2f8,#fbcfe8);border-color:#f472b6}
.theme-blue{background:linear-gradient(135deg,#eff6ff,#bfdbfe);border-color:#93c5fd}
.theme-purple{background:linear-gradient(135deg,#fdf4ff,#e9d5ff);border-color:#d8b4fe}
.theme-amber{background:linear-gradient(135deg,#fffbeb,#fde68a);border-color:#fcd34d}
</style>