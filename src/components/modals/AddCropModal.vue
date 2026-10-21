<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="close">
    <div class="modal-card">
      <div class="modal-header">
        <h3>Add New Crop Template</h3>
        <button @click="close" class="btn-close">✕</button>
      </div>
      <form @submit.prevent="handleSubmit" class="modal-form">
        <div class="form-group">
          <label>Crop Name</label>
          <input v-model="form.crop_name" type="text" placeholder="e.g., Durian, Mango, Pomelo" required />
        </div>
        <div class="form-group">
          <label>Variety</label>
          <input v-model="form.variety" type="text" placeholder="e.g., Puyat, Carabao, Magallanes" required />
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Trigger Type</label>
            <select v-model="form.trigger_type" class="form-select" required>
              <option value="DAFI">DAFI (Flower Induction)</option>
              <option value="DAF">DAF (Flowering / Bloom)</option>
              <option value="DAS">DAS (Sowing)</option>
              <option value="DAT">DAT (Transplanting)</option>
              <option value="WAP">WAP (Pruning / Flush)</option>
              <option value="WEEK">WEEK (Continuous Rolling)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Cycle Duration (Days)</label>
            <input v-model.number="form.expected_cycle_duration_days" type="number" placeholder="e.g., 120" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Tree Spacing (m)</label>
            <input v-model.number="form.standard_tree_spacing" type="number" step="0.5" placeholder="e.g., 10" />
          </div>
          <div class="form-group">
            <label>Water / Tree (L)</label>
            <input v-model.number="form.default_water_per_tree" type="number" step="1" placeholder="25" />
          </div>
        </div>

        <div class="form-group">
          <label>Description / Notes</label>
          <textarea v-model="form.description" placeholder="Brief notes on orchard management..." rows="2"></textarea>
        </div>

        <div class="modal-actions">
          <button type="button" @click="close" class="btn-secondary">Cancel</button>
          <button type="submit" :disabled="saving" class="btn-primary">
            {{ saving ? 'Saving...' : 'Save Template' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  isOpen: Boolean,
  saving: Boolean
});

const emit = defineEmits(['close', 'save']);

const form = ref({
  crop_name: '',
  variety: '',
  trigger_type: 'DAFI',
  expected_cycle_duration_days: 120,
  standard_tree_spacing: 10,
  default_water_per_tree: 25,
  description: ''
});

watch(() => props.isOpen, (val) => {
  if (!val) {
    form.value = {
      crop_name: '',
      variety: '',
      trigger_type: 'DAFI',
      expected_cycle_duration_days: 120,
      standard_tree_spacing: 10,
      default_water_per_tree: 25,
      description: ''
    };
  }
});

function close() {
  emit('close');
}

function handleSubmit() {
  emit('save', { ...form.value });
}
</script>

<style scoped>
.modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,0.4); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 50; }
.modal-card { background: #fff; border-radius: 12px; width: 100%; max-width: 480px; padding: 24px; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.15); display: flex; flex-direction: column; gap: 14px; text-align: left; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid #f1f5f9; }
.modal-header h3 { margin: 0; font-size: 1.1rem; color: #0f172a; font-weight: 700; }
.btn-close { background: none; border: none; font-size: 1rem; color: #64748b; cursor: pointer; }
.modal-form { display: flex; flex-direction: column; gap: 10px; }
.form-row { display: flex; gap: 10px; }
.form-group { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.form-group label { font-size: 0.72rem; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.02em; }
.form-group input, .form-group select, .form-group textarea { padding: 8px 10px; border: none; background: #f8fafc; border-radius: 8px; font-size: 0.825rem; outline: none; color: #0f172a; width: 100%; box-sizing: border-box; }
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { background: #f1f5f9; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
.btn-primary { padding: 8px 14px; background: #16a34a; color: #fff; border: none; border-radius: 8px; font-size: 0.825rem; font-weight: 600; cursor: pointer; }
.btn-primary:hover { background: #15803d; }
.btn-secondary { padding: 8px 14px; background: #f8fafc; color: #334155; border: none; border-radius: 8px; font-size: 0.825rem; font-weight: 600; cursor: pointer; }
.btn-secondary:hover { background: #f1f5f9; }
</style>