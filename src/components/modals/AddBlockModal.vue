<template>
  <div v-if="show" class="modal-backdrop" @click.self="close">
    <div class="modal-card">
      <div class="modal-header">
        <h3>Add Production Block</h3>
        <button @click="close" class="btn-close">✕</button>
      </div>

      <form @submit.prevent="handleSubmit" class="block-form">
        <div class="form-group">
          <label>Block Code / Name</label>
          <input v-model="form.block_code" placeholder="e.g. B1-01 or North Block" required />
        </div>

        <div class="form-group">
          <label>Primary Crop</label>
          <select v-model="form.primary_crop" class="form-select" required>
            <option value="" disabled selected>-- Select Crop --</option>
            <option v-for="crop in cropTemplates" :key="crop.id" :value="crop.crop_name">
              {{ crop.crop_name }} ({{ crop.variety }})
            </option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Hectarage (Ha)</label>
            <input v-model="form.hectarage" type="number" step="0.01" placeholder="e.g. 5.50" required />
          </div>
          <div class="form-group">
            <label>Tree Count</label>
            <input v-model="form.tree_count" type="number" placeholder="e.g. 250" />
          </div>
        </div>

        <div class="form-group">
          <label>Status</label>
          <select v-model="form.status" class="form-select">
            <option value="Active">Active</option>
            <option value="Fallow">Fallow</option>
            <option value="Replanting">Replanting</option>
          </select>
        </div>

        <div class="modal-actions">
          <button type="button" @click="close" class="btn-secondary">Cancel</button>
          <button type="submit" :disabled="saving" class="btn-primary">
            {{ saving ? 'Saving Block...' : 'Create Block' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { supabase } from '../../providers/supabaseProvider.js';

const props = defineProps({ show: Boolean, saving: Boolean });
const emit = defineEmits(['close', 'save']);

const form = ref({ block_code: '', primary_crop: '', hectarage: '', tree_count: '', status: 'Active' });
const cropTemplates = ref([]);

async function loadCropTemplates() {
  try {
    // Fixed: changed 'name' to 'crop_name' to match crop_templates table schema
    const { data, error } = await supabase.from('crop_templates').select('id, crop_name, variety').order('crop_name');
    if (!error && data) cropTemplates.value = data;
  } catch (err) { console.error(err); }
}

watch(() => props.show, (val) => {
  if (!val) form.value = { block_code: '', primary_crop: '', hectarage: '', tree_count: '', status: 'Active' };
  else loadCropTemplates();
});

onMounted(loadCropTemplates);

function close() { emit('close'); }
function handleSubmit() {
  emit('save', {
    ...form.value,
    hectarage: parseFloat(form.value.hectarage) || 0,
    tree_count: form.value.tree_count ? parseInt(form.value.tree_count) : null
  });
}
</script>

<style scoped>
.modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,0.5); display: flex; align-items: center; justify-content: center; z-index: 50; }
.modal-card { background: #fff; border-radius: 8px; width: 100%; max-width: 420px; padding: 20px; border: 1px solid #cbd5e1; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.modal-header h3 { margin: 0; font-size: 1.1rem; color: #0f172a; }
.btn-close { background: none; border: none; font-size: 1rem; color: #64748b; cursor: pointer; padding: 4px; }
.block-form { display: flex; flex-direction: column; gap: 10px; }
.form-group { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.form-row { display: flex; gap: 10px; }
.form-group label { font-size: 0.8rem; font-weight: 600; color: #475569; }
.form-group input, .form-select { padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.875rem; width: 100%; box-sizing: border-box; background: #fff; }
.form-select { cursor: pointer; color: #0f172a; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px; }
.btn-primary, .btn-secondary { padding: 8px 14px; border-radius: 6px; font-weight: 600; font-size: 0.875rem; cursor: pointer; border: none; }
.btn-primary { background: #16a34a; color: #fff; }
.btn-primary:hover { background: #15803d; }
.btn-primary:disabled { background: #94a3b8; cursor: not-allowed; }
.btn-secondary { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
.btn-secondary:hover { background: #e2e8f0; color: #0f172a; }
</style>