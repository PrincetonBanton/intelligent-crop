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
          @click="selectCropForStages(crop)"
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
              <span class="detail-label">Spacing:</span>
              <span class="detail-value"><b>{{ crop.standard_tree_spacing || 'N/A' }}</b> meters</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Notes:</span>
              <span class="detail-value desc-text">{{ crop.description || 'No operational notes added.' }}</span>
            </div>
          </div>

          <!-- Card Footer Link -->
          <div class="card-footer">
            <span class="view-link">Configure Stages &rarr;</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Crop Modal -->
    <div v-if="showAddModal" class="modal-backdrop" @click.self="showAddModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Add New Crop Template</h3>
          <button @click="showAddModal = false" class="btn-close">✕</button>
        </div>
        <form @submit.prevent="handleCreateTemplate" class="modal-form">
          <div class="form-group">
            <label>Crop Name</label>
            <input v-model="newCrop.crop_name" type="text" placeholder="e.g., Durian, Mango, Pomelo" required />
          </div>
          <div class="form-group">
            <label>Variety</label>
            <input v-model="newCrop.variety" type="text" placeholder="e.g., Puyat, Carabao, Magallanes" required />
          </div>
          <div class="form-group">
            <label>Standard Tree Spacing</label>
            <input v-model.number="newCrop.standard_tree_spacing" type="number" step="0.5" placeholder="e.g., 10" />
          </div>
          <div class="form-group">
            <label>Description / Notes</label>
            <textarea v-model="newCrop.description" placeholder="Brief notes on orchard management..." rows="3"></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showAddModal = false" class="btn-secondary">Cancel</button>
            <button type="submit" :disabled="saving" class="btn-primary">
              {{ saving ? 'Saving...' : 'Save Template' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Add this component at the bottom of your CropView.vue template -->
  <CropStagesModal :isOpen="showStagesModal" :crop="selectedCropForConfig" @close="showStagesModal = false" />

</template>

<script setup>
import { ref, onMounted } from 'vue';
import { cropService } from '../services/cropService.js';
import CropStagesModal from '../components/modals/CropStagesModal.vue';


const templates = ref([]);
const loading = ref(true);
const showAddModal = ref(false);
const saving = ref(false);
const showStagesModal = ref(false);
const selectedCropForConfig = ref(null);

function selectCropForStages(crop) {
  selectedCropForConfig.value = crop;
  showStagesModal.value = true;
}

const newCrop = ref({
  crop_name: '',
  variety: '',
  standard_tree_spacing: null,
  description: ''
});

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

async function handleCreateTemplate() {
  saving.value = true;
  try {
    await cropService.createCropTemplate(newCrop.value);
    showAddModal.value = false;
    newCrop.value = { crop_name: '', variety: '', standard_tree_spacing: null, description: '' };
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

.crop-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}
.crop-profile-card{border-radius:10px;border:1px solid rgba(0,0,0,0.08);overflow:hidden;cursor:pointer;display:flex;flex-direction:column;transition:transform 0.2s,box-shadow 0.2s}
.crop-profile-card:hover{transform:translateY(-2px);box-shadow:0 8px 16px -4px rgba(0,0,0,0.08);border-color:rgba(0,0,0,0.15)}

.card-banner{padding:12px 14px 8px;display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
.banner-title-group{display:flex;flex-direction:column;min-width:0;width:100%}
.crop-name{font-size:0.95rem;font-weight:800;color:#0f172a;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.variety-text{font-size:0.75rem;color:#334155;font-weight:600;margin-top:2px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

.btn-delete{background:rgba(255,255,255,0.8);border:1px solid #fee2e2;color:#ef4444;width:22px;height:22px;border-radius:6px;font-size:0.7rem;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.btn-delete:hover{background:#fee2e2}

.profile-body-stacked{padding:8px 14px 12px;display:flex;flex-direction:column;gap:6px;border-top:1px solid rgba(0,0,0,0.06);border-bottom:1px solid rgba(0,0,0,0.06)}
.detail-row{display:flex;align-items:baseline;gap:6px;font-size:0.75rem;color:#0f172a}
.detail-label{font-size:0.68rem;color:#475569;font-weight:700;text-transform:uppercase;min-width:52px;flex-shrink:0}
.detail-value{font-size:0.78rem;font-weight:600;color:#0f172a}
.desc-text{color:#334155;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px}

.card-footer{padding:8px 14px;text-align:right;margin-top:auto}
.view-link{font-size:0.75rem;font-weight:700;color:#15803d}

.theme-green{background:#dcfce7}
.theme-yellow{background:#fef08a}
.theme-pink{background:#fbcfe8}
.theme-blue{background:#bfdbfe}
.theme-purple{background:#e9d5ff}
.theme-amber{background:#fde68a}

.modal-backdrop{position:fixed;inset:0;background:rgba(15,23,42,0.4);backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;z-index:50}
.modal-card{background:#fff;border-radius:12px;width:100%;max-width:440px;padding:24px;box-shadow:0 20px 40px -10px rgba(0,0,0,0.15);display:flex;flex-direction:column;gap:16px}
.modal-header{display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid #f1f5f9}
.modal-header h3{margin:0;font-size:1.1rem;color:#0f172a;font-weight:700}
.btn-close{background:none;border:none;font-size:1rem;color:#64748b;cursor:pointer}
.modal-form{display:flex;flex-direction:column;gap:12px}
.form-group{display:flex;flex-direction:column;gap:4px}
.form-group label{font-size:0.75rem;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:0.02em}
.form-group input,.form-group textarea{padding:9px 12px;border:none;background:#f8fafc;border-radius:8px;font-size:0.85rem;outline:none;color:#0f172a}
.form-group input:focus,.form-group textarea:focus{background:#f1f5f9}
.modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:10px}
.btn-primary{padding:9px 16px;background:#16a34a;color:#fff;border:none;border-radius:8px;font-size:0.85rem;font-weight:600;cursor:pointer;transition:background 0.2s}
.btn-primary:hover{background:#15803d}
.btn-secondary{padding:9px 16px;background:#f8fafc;color:#334155;border:none;border-radius:8px;font-size:0.85rem;font-weight:600;cursor:pointer}
.btn-secondary:hover{background:#f1f5f9}
.no-results,.empty-state{text-align:center;color:#64748b;padding:32px 0;font-size:0.85rem}
</style>