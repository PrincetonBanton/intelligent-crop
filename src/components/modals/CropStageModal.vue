<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="close">
    <div class="modal-card">
      <div class="modal-header">
        <h3>{{ isEditing ? 'Edit Phenological Stage' : 'Add Phenological Stage' }}</h3>
        <button @click="close" class="btn-close">✕</button>
      </div>
      <p class="modal-desc">
        Configure stage milestone intervals (DAFI) and target pests for this crop cycle.
      </p>

      <form @submit.prevent="handleSubmit" class="modal-form">
        <!-- Stage Name -->
        <div class="form-group">
          <label>Stage Name</label>
          <input 
            v-model="form.stage_name" 
            type="text" 
            placeholder="e.g., Flower Induction, Fruit Development" 
            required
            class="form-input"
          />
        </div>

        <!-- DAFI Start & End -->
        <div class="form-row">
          <div class="form-group">
            <label>DAFI Start (Day)</label>
            <input 
              v-model.number="form.dafi_start" 
              type="number" 
              min="0" 
              required
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>DAFI End (Day)</label>
            <input 
              v-model.number="form.dafi_end" 
              type="number" 
              min="0" 
              required
              class="form-input"
            />
          </div>
        </div>

        <!-- Target Pests (Comma-separated) -->
        <div class="form-group">
          <label>Target Pests / Diseases (Comma-separated)</label>
          <input 
            v-model="pestsInput" 
            type="text" 
            placeholder="e.g., Thrips, Aphids, Anthracnose" 
            class="form-input"
          />
        </div>

        <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>

        <!-- Actions -->
        <div class="modal-actions-between">
          <div>
            <button 
              v-if="isEditing" 
              type="button" 
              @click="handleDelete" 
              :disabled="submitting" 
              class="btn-danger"
            >
              Delete Stage
            </button>
          </div>
          <div class="right-actions">
            <button type="button" @click="close" class="btn-secondary">Cancel</button>
            <button type="submit" :disabled="submitting" class="btn-primary">
              {{ submitting ? 'Saving...' : (isEditing ? 'Update Stage' : 'Save Stage') }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { supabase } from '../../providers/supabaseProvider.js';

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  templateId: { type: String, required: true },
  stage: { type: Object, default: null } // If null, we are creating a new stage
});

const emit = defineEmits(['close', 'saved']);

const submitting = ref(false);
const errorMessage = ref('');
const pestsInput = ref('');

const form = ref({
  stage_name: '',
  dafi_start: 0,
  dafi_end: 15,
  target_pests: []
});

const isEditing = computed(() => !!props.stage?.id);

watch(() => props.isOpen, (val) => {
  if (val) {
    if (props.stage) {
      form.value.stage_name = props.stage.stage_name || '';
      form.value.dafi_start = props.stage.dafi_start ?? 0;
      form.value.dafi_end = props.stage.dafi_end ?? 15;
      pestsInput.value = Array.isArray(props.stage.target_pests) ? props.stage.target_pests.join(', ') : '';
    } else {
      form.value = { stage_name: '', dafi_start: 0, dafi_end: 15, target_pests: [] };
      pestsInput.value = '';
    }
    errorMessage.value = '';
  }
});

async function handleSubmit() {
  if (!form.value.stage_name.trim()) {
    errorMessage.value = 'Please provide a stage name.';
    return;
  }
  if (form.value.dafi_start > form.value.dafi_end) {
    errorMessage.value = 'DAFI Start cannot be greater than DAFI End.';
    return;
  }

  submitting.value = true;
  errorMessage.value = '';

  const parsedPests = pestsInput.value
    ? pestsInput.value.split(',').map(p => p.trim()).filter(Boolean)
    : [];

  try {
    const payload = {
      template_id: props.templateId,
      stage_name: form.value.stage_name.trim(),
      dafi_start: form.value.dafi_start,
      dafi_end: form.value.dafi_end,
      target_pests: parsedPests
    };

    if (isEditing.value) {
      const { error } = await supabase
        .from('crop_stages')
        .update(payload)
        .eq('id', props.stage.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('crop_stages')
        .insert([payload]);
      if (error) throw error;
    }

    emit('saved');
    close();
  } catch (err) {
    console.error('Failed to save stage:', err.message);
    errorMessage.value = 'Failed to save: ' + err.message;
  } finally {
    submitting.value = false;
  }
}

async function handleDelete() {
  if (!confirm(`Are you sure you want to delete stage "${props.stage.stage_name}"?`)) return;

  submitting.value = true;
  try {
    const { error } = await supabase
      .from('crop_stages')
      .delete()
      .eq('id', props.stage.id);
    if (error) throw error;

    emit('saved');
    close();
  } catch (err) {
    console.error('Failed to delete stage:', err.message);
    errorMessage.value = 'Failed to delete: ' + err.message;
  } finally {
    submitting.value = false;
  }
}

function close() {
  emit('close');
}
</script>

<style scoped>
.modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,0.5); display: flex; align-items: center; justify-content: center; z-index: 70; }
.modal-card { background: #fff; border-radius: 8px; width: 100%; max-width: 480px; padding: 24px; border: 1px solid #cbd5e1; box-shadow: 0 10px 25px rgba(0,0,0,0.15); color: #000; text-align: left; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.modal-header h3 { margin: 0; font-size: 1.15rem; font-weight: 700; color: #0f172a; }
.modal-desc { font-size: 0.82rem; color: #475569; margin-bottom: 16px; }

.modal-form { display: flex; flex-direction: column; gap: 14px; }
.form-group { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.form-row { display: flex; gap: 12px; }
.form-group label { font-size: 0.78rem; font-weight: 700; color: #334155; text-transform: uppercase; }
.form-input { padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; outline: none; background: #fff; color: #0f172a; width: 100%; box-sizing: border-box; }
.form-input:focus { border-color: #16a34a; }

.error-msg { font-size: 0.78rem; color: #dc2626; margin: 0; font-weight: 600; }

.modal-actions-between { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
.right-actions { display: flex; gap: 8px; }
.btn-primary { padding: 7px 14px; background: #16a34a; color: #fff; border: none; border-radius: 6px; font-weight: 600; font-size: 0.85rem; cursor: pointer; }
.btn-primary:hover { background: #15803d; }
.btn-secondary { padding: 7px 12px; border-radius: 6px; font-weight: 600; font-size: 0.85rem; cursor: pointer; border: 1px solid #cbd5e1; background: #f1f5f9; color: #334155; }
.btn-secondary:hover { background: #e2e8f0; }
.btn-danger { padding: 7px 12px; background: #fee2e2; color: #ef4444; border: 1px solid #fecaca; border-radius: 6px; font-weight: 600; font-size: 0.85rem; cursor: pointer; }
.btn-danger:hover { background: #fecaca; }
.btn-close { background: none; border: none; font-size: 1rem; color: #64748b; cursor: pointer; padding: 4px; }
.btn-close:hover { color: #000; }
</style>