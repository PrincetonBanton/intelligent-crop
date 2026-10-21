<template>
  <div v-if="show" class="modal-backdrop" @click.self="close">
    <div class="modal-card">
      <div class="modal-header">
        <h3>{{ isEditing ? 'Manage Farm Entity' : 'Add New Farm' }}</h3>
        <button @click="close" class="btn-close">✕</button>
      </div>

      <form @submit.prevent="handleSubmit" class="farm-form">
        <div class="form-group">
          <label>Farm Code / Name</label>
          <input v-model="form.name" placeholder="e.g. B1 - Baracatan" required />
        </div>

        <div class="form-group">
          <label>Location / Region</label>
          <input v-model="form.location" placeholder="e.g. Sta. Cruz, Davao del Sur" required />
        </div>

        <div class="form-group">
          <label>Total Hectarage (Ha)</label>
          <input v-model="form.total_hectarage" type="number" step="0.01" placeholder="e.g. 45.00" required />
        </div>

        <div class="form-group">
          <label>Primary Crop(s)</label>
          <div class="crop-checkbox-container">
            <div v-if="cropTemplates.length === 0" class="no-crops-msg">Loading crop database...</div>
            <label v-for="crop in cropTemplates" :key="crop.id" class="crop-checkbox-label">
              <input type="checkbox" :value="crop.crop_name" v-model="selectedCrops" />
              <span>{{ crop.crop_name }} <small>({{ crop.variety }})</small></span>
            </label>
          </div>
          <small class="helper-text">Select crops present in this farm.</small>
        </div>

        <div class="modal-actions-between">
          <div>
            <button 
              v-if="isEditing" 
              type="button" 
              @click="handleDelete" 
              :disabled="saving" 
              class="btn-danger"
            >
              Delete Farm
            </button>
          </div>
          <div class="right-actions">
            <button type="button" @click="close" class="btn-secondary">Cancel</button>
            <button type="submit" :disabled="saving" class="btn-primary">
              {{ saving ? 'Saving...' : (isEditing ? 'Update Farm' : 'Register Farm Entity') }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { supabase } from '../../providers/supabaseProvider.js';

const props = defineProps({ 
  show: Boolean, 
  saving: Boolean,
  farmToEdit: { type: Object, default: null } // If provided, modal is in Edit Mode
});
const emit = defineEmits(['close', 'save', 'delete']);

const form = ref({ name: '', location: '', total_hectarage: '', primary_crop: '' });
const cropTemplates = ref([]);
const selectedCrops = ref([]);

const isEditing = computed(() => !!props.farmToEdit?.id);

async function loadCropTemplates() {
  try {
    const { data, error } = await supabase.from('crop_templates').select('id, crop_name, variety').order('crop_name');
    if (!error && data) cropTemplates.value = data;
  } catch (err) { console.error(err); }
}

watch(() => props.show, (val) => {
  if (val) {
    loadCropTemplates();
    if (props.farmToEdit) {
      form.value = { 
        name: props.farmToEdit.name || '', 
        location: props.farmToEdit.location || '', 
        total_hectarage: props.farmToEdit.total_hectarage || '', 
        primary_crop: props.farmToEdit.primary_crop || '' 
      };
      // Pre-select crops based on saved primary_crop string (e.g. "Durian / Mango")
      selectedCrops.value = props.farmToEdit.primary_crop 
        ? props.farmToEdit.primary_crop.split(' / ').map(c => c.trim()) 
        : [];
    } else {
      form.value = { name: '', location: '', total_hectarage: '', primary_crop: '' };
      selectedCrops.value = [];
    }
  }
});

onMounted(loadCropTemplates);

function close() { emit('close'); }

function handleSubmit() {
  const payload = {
    ...form.value,
    primary_crop: selectedCrops.value.length ? selectedCrops.value.join(' / ') : 'Mixed'
  };
  emit('save', payload);
}

function handleDelete() {
  if (props.farmToEdit) {
    emit('delete', props.farmToEdit);
  }
}
</script>

<style scoped>
.modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,0.5); display: flex; align-items: center; justify-content: center; z-index: 50; }
.modal-card { background: #fff; border-radius: 8px; width: 100%; max-width: 440px; padding: 20px; border: 1px solid #cbd5e1; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); text-align: left; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.modal-header h3 { margin: 0; font-size: 1.1rem; color: #0f172a; font-weight: 700; }
.btn-close { background: none; border: none; font-size: 1rem; color: #64748b; cursor: pointer; padding: 4px; }
.farm-form { display: flex; flex-direction: column; gap: 12px; }
.form-group { display: flex; flex-direction: column; gap: 4px; }
.form-group label { font-size: 0.8rem; font-weight: 600; color: #475569; }
.form-group input { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.875rem; width: 100%; box-sizing: border-box; background: #fff; color: #0f172a; }
.crop-checkbox-container { display: flex; flex-direction: column; gap: 6px; max-height: 140px; overflow-y: auto; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; background: #f8fafc; }
.crop-checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 0.825rem; color: #1e293b; cursor: pointer; }
.crop-checkbox-label input { width: auto; cursor: pointer; }
.crop-checkbox-label small { color: #64748b; }
.no-crops-msg { font-size: 0.8rem; color: #94a3b8; text-align: center; padding: 10px; }
.helper-text { font-size: 0.725rem; color: #94a3b8; }

.modal-actions-between { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; }
.right-actions { display: flex; gap: 8px; }
.btn-primary, .btn-secondary, .btn-danger { padding: 8px 14px; border-radius: 6px; font-weight: 600; font-size: 0.875rem; cursor: pointer; border: none; }
.btn-primary { background: #16a34a; color: #fff; }
.btn-primary:hover { background: #15803d; }
.btn-primary:disabled { background: #94a3b8; cursor: not-allowed; }
.btn-secondary { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
.btn-secondary:hover { background: #e2e8f0; color: #0f172a; }
.btn-danger { background: #fee2e2; color: #ef4444; border: 1px solid #fecaca; }
.btn-danger:hover { background: #fecaca; }
</style>