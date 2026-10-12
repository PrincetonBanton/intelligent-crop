<template>
  <div class="dashboard-view">
    <!-- View Header with Farm Selector Dropdown -->
    <div class="view-header">
      <div class="list-header">
        <h2>Operational Dashboard</h2>
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
        <!-- Compact Block Grid Section -->
        <div class="blocks-grid">
          <div v-for="block in blocks" :key="block.id" :class="['block-card-circle', getCropTheme(block.primary_crop)]" @click="handleCardClick(block)">
            <div class="circle-content">
              <strong class="block-code">{{ block.block_code }}</strong>
              <span class="crop-text">{{ block.primary_crop || 'General' }}</span>
              
              <div class="block-details-stack">
                <span class="detail-row"><b>Area:</b> {{ block.hectarage }} Ha</span>
                <span class="detail-row"><b>Trees:</b> {{ block.tree_count || 'N/A' }}</span>
              </div>
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
.dashboard-view { display: flex; flex-direction: column; gap: 16px; text-align: left; background: #fff; margin: 0; padding: 0; }
.view-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; margin: 0; background: #fff; }
.list-header { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.list-header h2 { margin: 0; font-size: 1.25rem; font-weight: 700; color: #0f172a; }
.farm-dropdown-main { padding: 6px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; font-weight: 600; background: #fff; color: #0f172a; cursor: pointer; }
.badge { background: #ecfdf5; color: #047857; font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 12px; }
.card { background: #fff; padding: 0; margin: 0; border: none; }
.state-msg { color: #64748b; font-size: 0.85rem; padding: 24px 0; text-align: center; }

.dashboard-content { display: flex; flex-direction: column; gap: 20px; }

/* Resized Compact Block Grid */
.blocks-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 14px; align-items: center; }
.block-card-circle { width: 130px; height: 130px; border-radius: 50%; border: 1.5px solid #64748b; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px; text-align: center; position: relative; cursor: pointer; box-shadow: 0 4px 12px -2px rgba(0,0,0,0.06); transition: all 0.2s ease; margin: 0 auto; box-sizing: border-box; }
.block-card-circle:hover { transform: translateY(-2px); border-color: #0f172a; box-shadow: 0 10px 18px -4px rgba(0,0,0,0.12); }
.circle-content { display: flex; flex-direction: column; align-items: center; gap: 1px; width: 100%; }

.block-code, .crop-text, .detail-row { color: #000000; text-shadow: 0 1px 1px rgba(255,255,255,0.4); }
.block-code { font-size: 0.85rem; font-weight: 800; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1.1; }
.crop-text { font-size: 0.65rem; font-weight: 600; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 2px; }

.block-details-stack { display: flex; flex-direction: column; gap: 0; background: transparent; padding: 0; font-size: 0.62rem; width: 100px; text-align: center; box-sizing: border-box; }
.detail-row { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1.2; }

/* 6 Crop Theme Color Palettes */
.theme-green { background: linear-gradient(145deg, #f0fdf4, #dcfce7); }
.theme-yellow { background: linear-gradient(145deg, #fefce8, #fef08a); }
.theme-pink { background: linear-gradient(145deg, #fdf2f8, #fbcfe8); }
.theme-blue { background: linear-gradient(145deg, #eff6ff, #bfdbfe); }
.theme-purple { background: linear-gradient(145deg, #fdf4ff, #e9d5ff); }
.theme-amber { background: linear-gradient(145deg, #fffbeb, #fde68a); }
</style>