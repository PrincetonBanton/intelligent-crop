<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="close">
    <div class="modal-card wide-modal">
      <div class="modal-header">
        <div>
          <h3>Phenological Stages: {{ crop?.crop_name }} ({{ crop?.variety }})</h3>
          <span class="sub-subtitle">Define timeline milestones and stage-specific pest vulnerabilities (DAFI = Days After Flower Induction).</span>
        </div>
        <button @click="close" class="btn-close">✕</button>
      </div>

      <div class="modal-body-stack">
        <!-- Existing Stages List -->
        <div class="stages-container">
          <div v-if="loading" class="no-results">Loading stages...</div>
          <div v-else-if="stages.length === 0" class="empty-state">
            <p>No stages defined yet for this crop template. Add your first milestone below.</p>
          </div>
          <div v-else class="stages-timeline">
            <div v-for="stage in stages" :key="stage.id" class="stage-card">
              <div class="stage-info">
                <div class="stage-title-row">
                  <span class="stage-name">{{ stage.stage_name }}</span>
                  <span class="dafi-badge">DAFI {{ stage.dafi_start }} – {{ stage.dafi_end }}</span>
                </div>
                <div class="pest-targets">
                  <span class="pest-label">Target Pests:</span>
                  <div v-if="stage.target_pests && stage.target_pests.length > 0" class="pest-chips">
                    <span v-for="(pest, idx) in stage.target_pests" :key="idx" class="pest-chip">{{ pest }}</span>
                  </div>
                  <span v-else class="no-pest-text">None specified</span>
                </div>
              </div>
              <button @click="handleDeleteStage(stage.id)" class="btn-delete-stage" title="Delete stage">✕</button>
            </div>
          </div>
        </div>

        <!-- Add New Stage Form -->
        <form @submit.prevent="handleAddStage" class="add-stage-form">
          <h4>Add New Stage Milestone</h4>
          <div class="form-row-grid">
            <div class="form-group">
              <label>Stage Name</label>
              <input v-model="newStage.stage_name" placeholder="e.g. Fruit Set / Post-Bloom" required />
            </div>
            <div class="form-row-sub">
              <div class="form-group">
                <label>DAFI Start</label>
                <input v-model.number="newStage.dafi_start" type="number" min="0" placeholder="0" required />
              </div>
              <div class="form-group">
                <label>DAFI End</label>
                <input v-model.number="newStage.dafi_end" type="number" min="0" placeholder="15" required />
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>Target Pests (Comma-separated)</label>
            <input v-model="pestInputString" placeholder="e.g. Citrus Rind Borer, Aphids, Fruit Borer" />
            <small class="helper-text">These will match against your IPM chemical roster targets.</small>
          </div>

          <div class="modal-actions">
            <button type="submit" :disabled="saving" class="btn-primary">
              {{ saving ? 'Adding Stage...' : '+ Add Stage Milestone' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { cropService } from '../../services/cropService.js';

const props = defineProps({
  isOpen: Boolean,
  crop: Object
});

const emit = defineEmits(['close']);

const stages = ref([]);
const loading = ref(false);
const saving = ref(false);
const pestInputString = ref('');

const newStage = ref({
  stage_name: '',
  dafi_start: 0,
  dafi_end: 15,
  target_pests: []
});

async function loadStages() {
  if (!props.crop?.id) return;
  loading.value = true;
  try {
    stages.value = await cropService.getStagesByTemplate(props.crop.id);
  } catch (err) {
    console.error('Failed to load stages:', err.message);
  } finally {
    loading.value = false;
  }
}

watch(() => props.isOpen, (val) => {
  if (val && props.crop?.id) {
    loadStages();
    newStage.value = { stage_name: '', dafi_start: 0, dafi_end: 15, target_pests: [] };
    pestInputString.value = '';
  }
});

async function handleAddStage() {
  if (!props.crop?.id) return;
  saving.value = true;
  try {
    // Parse comma-separated pests into an array
    const pestsArray = pestInputString.value
      ? pestInputString.value.split(',').map(p => p.trim()).filter(Boolean)
      : [];

    const payload = {
      template_id: props.crop.id,
      stage_name: newStage.value.stage_name,
      dafi_start: parseInt(newStage.value.dafi_start) || 0,
      dafi_end: parseInt(newStage.value.dafi_end) || 0,
      target_pests: pestsArray
    };

    await cropService.createStage(payload);
    newStage.value = { stage_name: '', dafi_start: 0, dafi_end: 15, target_pests: [] };
    pestInputString.value = '';
    await loadStages();
  } catch (err) {
    alert('Error adding stage: ' + err.message);
  } finally {
    saving.value = false;
  }
}

async function handleDeleteStage(stageId) {
  if (!confirm('Are you sure you want to delete this stage?')) return;
  try {
    await cropService.deleteStage(stageId);
    await loadStages();
  } catch (err) {
    alert('Error deleting stage: ' + err.message);
  }
}

function close() {
  emit('close');
}
</script>

<style scoped>
.modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,0.5); display: flex; align-items: center; justify-content: center; z-index: 50; }
.modal-card.wide-modal { background: #fff; border-radius: 8px; width: 100%; max-width: 640px; padding: 24px; border: 1px solid #cbd5e1; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); text-align: left; box-sizing: border-box; max-height: 90vh; overflow-y: auto; }
.modal-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px; }
.modal-header h3 { margin: 0 0 4px 0; font-size: 1.15rem; color: #0f172a; }
.sub-subtitle { font-size: 0.8rem; color: #64748b; }
.btn-close { background: none; border: none; font-size: 1rem; color: #64748b; cursor: pointer; }
.modal-body-stack { display: flex; flex-direction: column; gap: 20px; }
.stages-container { border: 1px solid #cbd5e1; border-radius: 8px; background: #f8fafc; padding: 12px; max-height: 260px; overflow-y: auto; }
.stages-timeline { display: flex; flex-direction: column; gap: 8px; }
.stage-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.stage-info { display: flex; flex-direction: column; gap: 6px; flex: 1; }
.stage-title-row { display: flex; justify-content: space-between; align-items: center; }
.stage-name { font-weight: 700; font-size: 0.9rem; color: #0f172a; }
.dafi-badge { background: #dcfce7; color: #166534; font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; }
.pest-targets { display: flex; align-items: center; gap: 8px; font-size: 0.78rem; flex-wrap: wrap; }
.pest-label { color: #64748b; font-weight: 600; }
.pest-chips { display: flex; gap: 4px; flex-wrap: wrap; }
.pest-chip { background: #f1f5f9; border: 1px solid #cbd5e1; color: #334155; padding: 1px 6px; border-radius: 4px; font-size: 0.7rem; }
.no-pest-text { color: #94a3b8; font-style: italic; }
.btn-delete-stage { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 0.9rem; }
.btn-delete-stage:hover { color: #dc2626; }
.add-stage-form { border-top: 1px solid #e2e8f0; padding-top: 16px; display: flex; flex-direction: column; gap: 12px; }
.add-stage-form h4 { margin: 0; font-size: 0.95rem; color: #0f172a; font-weight: 700; }
.form-row-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 12px; }
.form-row-sub { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.form-group { display: flex; flex-direction: column; gap: 4px; }
.form-group label { font-size: 0.75rem; font-weight: 600; color: #475569; text-transform: uppercase; }
.form-group input { padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; outline: none; color: #0f172a; background: #fff; }
.form-group input:focus { border-color: #16a34a; }
.helper-text { font-size: 0.7rem; color: #94a3b8; }
.modal-actions { display: flex; justify-content: flex-end; margin-top: 4px; }
.btn-primary { padding: 8px 16px; background: #16a34a; color: #fff; border: none; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
.btn-primary:hover { background: #15803d; }
.no-results, .empty-state { text-align: center; color: #64748b; padding: 24px 0; font-size: 0.85rem; }
</style>