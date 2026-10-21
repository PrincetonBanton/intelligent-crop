<template>
  <div class="crop-setup-view">
    <div class="view-header">
      <div>
        <h2>Crop Setup & Management</h2>
        <span class="sub-subtitle">Manage baseline orchard crop templates, varieties, and phenological lifecycles.</span>
      </div>
      <div class="header-actions">
        <button @click="showAddModal = true" class="btn-primary">+ Add Crop Template</button>
      </div>
    </div>

    <!-- Crop Templates Grid Container -->
    <div class="content-container">
      <div v-if="loading" class="no-results">Loading crop templates...</div>
      
      <div v-else-if="templates.length === 0" class="empty-state">
        <p>No crop templates found. Click "+ Add Crop Template" to get started.</p>
      </div>

      <div v-else class="crop-grid">
        <div 
          v-for="(crop, index) in templates" 
          :key="crop.id" 
          :class="['crop-profile-card', getThemeClass(index)]"
          @click="showCropDetailsAlert(crop)"
        >
          <!-- Top Section -->
          <div class="card-banner">
            <div class="banner-title-group">
              <h4 class="crop-name" :title="crop.crop_name">{{ crop.crop_name }}</h4>
              <span class="variety-text">{{ crop.variety }}</span>
            </div>
            <button @click.stop="deleteTemplate(crop.id)" class="btn-delete" title="Delete template">✕</button>
          </div>

          <!-- Vertical Stacked Details Section -->
          <div class="profile-body-stacked">
            <div class="detail-row">
              <span class="detail-label">Trigger:</span>
              <span class="detail-value"><span class="trigger-badge">{{ crop.trigger_type || 'DAFI' }}</span></span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Cycle:</span>
              <span class="detail-value"><b>{{ crop.expected_cycle_duration_days || 120 }}</b> days</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Spacing:</span>
              <span class="detail-value"><b>{{ crop.standard_tree_spacing || 'N/A' }}</b>m</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Notes:</span>
              <span class="detail-value desc-text">{{ crop.description || 'No operational notes added.' }}</span>
            </div>
          </div>

          <!-- Card Footer Links -->
          <div class="card-footer">
            <button @click.stop="openRulerTest(crop)" class="btn-ruler-test" title="Test 0-N Day Continuous Ruler">
              Cycle Ruler
            </button>
            <span @click.stop="selectCropForStages(crop)" class="view-link">Configure Stages &rarr;</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modular Add Crop Modal -->
    <AddCropModal 
      :isOpen="showAddModal" 
      :saving="saving" 
      @close="showAddModal = false" 
      @save="handleCreateTemplate" 
    />

    <!-- Stages Configuration Modal -->
    <CropStagesModal 
      :isOpen="showStagesModal" 
      :crop="selectedCropForConfig" 
      @close="showStagesModal = false" 
    />

    <!-- Cycle Ruler Modal Component -->
    <CycleRulerModal 
      :isOpen="showRulerModal" 
      :crop="selectedCropForRuler" 
      @close="showRulerModal = false" 
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { cropService } from '../services/cropService.js';
import CropStagesModal from '../components/modals/CropStagesModal.vue';
import AddCropModal from '../components/modals/AddCropModal.vue';
import CycleRulerModal from '../components/modals/CycleRulerModal.vue';

const templates = ref([]);
const loading = ref(true);
const showAddModal = ref(false);
const saving = ref(false);
const showStagesModal = ref(false);
const selectedCropForConfig = ref(null);

// Ruler Test Modal State
const showRulerModal = ref(false);
const selectedCropForRuler = ref(null);

function showCropDetailsAlert(crop) {
  const details = [
    `🌱 Crop Template Details:`,
    `- Name: ${crop.crop_name}`,
    `- Variety: ${crop.variety}`,
    `- Trigger Metric: ${crop.trigger_type || 'DAFI'}`,
    `- Expected Cycle Duration: ${crop.expected_cycle_duration_days || 120} days`,
    `- Standard Tree Spacing: ${crop.standard_tree_spacing || 'N/A'} m`,
    `- Default Water / Tree: ${crop.default_water_per_tree || 'N/A'} L`,
    `- Notes: ${crop.description || 'None'}`
  ].join('\n');

  alert(details);
}

function selectCropForStages(crop) {
  selectedCropForConfig.value = crop;
  showStagesModal.value = true;
}

function openRulerTest(crop) {
  selectedCropForRuler.value = crop;
  showRulerModal.value = true;
}

const themes = ['theme-green', 'theme-yellow', 'theme-pink', 'theme-blue', 'theme-purple', 'theme-amber'];
function getThemeClass(index) { return themes[index % themes.length]; }

async function fetchTemplates() {
  loading.value = true;
  try {
    templates.value = await cropService.getCropTemplates();
  } catch (err) {
    console.error('Failed to load crop templates:', err.message);
  } finally {
    loading.value = false;
  }
}

async function handleCreateTemplate(newCropData) {
  saving.value = true;
  try {
    await cropService.createCropTemplate(newCropData);
    showAddModal.value = false;
    await fetchTemplates();
  } catch (err) {
    alert('Error creating template: ' + err.message);
  } finally {
    saving.value = false;
  }
}

async function deleteTemplate(id) {
  if (!confirm('Are you sure you want to delete this crop template?')) return;
  try {
    await cropService.deleteCropTemplate(id);
    await fetchTemplates();
  } catch (err) {
    alert('Error deleting template: ' + err.message);
  }
}

onMounted(() => {
  fetchTemplates();
});
</script>

<style scoped>
.crop-setup-view{display:flex;flex-direction:column;gap:20px;text-align:left;background:#f8fafc;padding:20px;border-radius:12px;box-sizing:border-box}
.view-header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:12px;border-bottom:1px solid #e2e8f0}
.view-header h2{margin:0;font-size:1.25rem;font-weight:700;color:#0f172a}
.sub-subtitle{font-size:0.825rem;color:#64748b}

.crop-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:16px}
.crop-profile-card{border-radius:10px;border:1px solid rgba(0,0,0,0.08);overflow:hidden;cursor:pointer;display:flex;flex-direction:column;transition:transform 0.2s,box-shadow 0.2s}
.crop-profile-card:hover{transform:translateY(-2px);box-shadow:0 8px 16px -4px rgba(0,0,0,0.08);border-color:rgba(0,0,0,0.15)}

.card-banner{padding:12px 14px 8px;display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
.banner-title-group{display:flex;flex-direction:column;min-width:0;width:100%}
.crop-name{font-size:0.95rem;font-weight:800;color:#0f172a;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.variety-text{font-size:0.75rem;color:#334155;font-weight:600;margin-top:2px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

.btn-delete{background:rgba(255,255,255,0.8);border:1px solid #fee2e2;color:#ef4444;width:22px;height:22px;border-radius:6px;font-size:0.7rem;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.btn-delete:hover{background:#fee2e2}

.profile-body-stacked{padding:8px 14px 12px;display:flex;flex-direction:column;gap:5px;border-top:1px solid rgba(0,0,0,0.06);border-bottom:1px solid rgba(0,0,0,0.06)}
.detail-row{display:flex;align-items:baseline;gap:6px;font-size:0.75rem;color:#0f172a}
.detail-label{font-size:0.68rem;color:#475569;font-weight:700;text-transform:uppercase;min-width:52px;flex-shrink:0}
.detail-value{font-size:0.78rem;font-weight:600;color:#0f172a}
.trigger-badge{background:rgba(0,0,0,0.1);padding:1px 6px;border-radius:4px;font-size:0.7rem;font-weight:700}
.desc-text{color:#334155;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px}

.card-footer{padding:6px 14px 10px;display:flex;justify-content:space-between;align-items:center;margin-top:auto}
.btn-ruler-test{background:#e0f2fe;color:#0284c7;border:1px solid #bae6fd;border-radius:6px;font-size:0.7rem;font-weight:700;padding:4px 8px;cursor:pointer;transition:all 0.2s}
.btn-ruler-test:hover{background:#bae6fd;color:#0369a1}
.view-link{font-size:0.75rem;font-weight:700;color:#15803d;cursor:pointer}
.view-link:hover{text-decoration:underline}

.theme-green{background:#dcfce7}
.theme-yellow{background:#fef08a}
.theme-pink{background:#fbcfe8}
.theme-blue{background:#bfdbfe}
.theme-purple{background:#e9d5ff}
.theme-amber{background:#fde68a}

.btn-primary{padding:9px 16px;background:#16a34a;color:#fff;border:none;border-radius:8px;font-size:0.85rem;font-weight:600;cursor:pointer;transition:background 0.2s}
.btn-primary:hover{background:#15803d}
.no-results,.empty-state{text-align:center;color:#64748b;padding:32px 0;font-size:0.85rem}
</style>