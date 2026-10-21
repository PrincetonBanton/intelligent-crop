<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="close">
    <div class="modal-card full-width-modal">
      <!-- Modal Header -->
      <div class="modal-header">
        <div>
          <h3>Phenological Timeline: {{ crop?.crop_name }} ({{ crop?.variety }})</h3>
          <span class="sub-subtitle">Milestones & target vulnerabilities (DAFI)</span>
        </div>
        <div class="header-actions">
          <button @click="showAddStageModal = true" class="btn-primary">+ Add Crop Stage</button>
          <button @click="close" class="btn-close">✕</button>
        </div>
      </div>

      <div class="modal-body-stack">
        <!-- Single-Line Readable Horizontal Timeline View -->
        <div class="stages-container">
          <div v-if="loading" class="no-results">Loading timeline...</div>
          <div v-else-if="stages.length === 0" class="empty-state">
            <p>No stages defined yet. Click "+ Add Crop Stage" above to create one.</p>
          </div>

          <div v-else class="timeline-horizontal-wrapper">
            <div class="timeline-line-horizontal"></div>
            <div v-for="stage in stages" :key="stage.id" class="timeline-item-h">
              <div class="timeline-node-h"></div>
              <div class="timeline-content-h">
                <div class="timeline-header-h">
                  <span class="stage-name" :title="stage.stage_name">{{ stage.stage_name }}</span>
                  <button @click="handleDeleteStage(stage.id)" class="btn-delete-stage" title="Delete stage">✕</button>
                </div>
                <span class="dafi-badge">DAFI {{ stage.dafi_start }}–{{ stage.dafi_end }}</span>
                
                <div class="pest-targets">
                  <span class="pest-label">Pests:</span>
                  <div v-if="stage.target_pests && stage.target_pests.length > 0" class="pest-chips">
                    <span v-for="(pest, idx) in stage.target_pests" :key="idx" class="pest-chip">{{ pest }}</span>
                  </div>
                  <span v-else class="no-pest-text">None</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Nested Add Crop Stage Modal -->
    <div v-if="showAddStageModal" class="nested-modal-backdrop" @click.self="showAddStageModal = false">
      <div class="nested-modal-card">
        <div class="modal-header">
          <h3>Add Crop Stage</h3>
          <button @click="showAddStageModal = false" class="btn-close">✕</button>
        </div>

        <form @submit.prevent="handleAddStage" class="add-stage-form">
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

          <div class="form-group">
            <label>Target Pests (Comma-separated)</label>
            <input v-model="pestInputString" placeholder="Citrus Rind Borer, Aphids" />
          </div>

          <div class="modal-actions">
            <button type="button" @click="showAddStageModal = false" class="btn-secondary">Cancel</button>
            <button type="submit" :disabled="saving" class="btn-primary">
              {{ saving ? 'Saving...' : 'Save Stage' }}
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
const showAddStageModal = ref(false);
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
    showAddStageModal.value = false;
  }
});

async function handleAddStage() {
  if (!props.crop?.id) return;
  saving.value = true;
  try {
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
    showAddStageModal.value = false;
    await loadStages();
  } catch (err) {
    alert('Error adding stage: ' + err.message);
  } finally {
    saving.value = false;
  }
}

async function handleDeleteStage(stageId) {
  if (!confirm('Delete this crop stage?')) return;
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
.modal-backdrop{position:fixed;inset:0;background:rgba(15,23,42,0.4);backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;z-index:50;padding:20px}
.modal-card.full-width-modal{background:#fff;border-radius:12px;width:100%;max-width:94vw;padding:24px;box-shadow:0 20px 40px -10px rgba(0,0,0,0.15);text-align:left;box-sizing:border-box;max-height:92vh;overflow-y:auto}
.modal-header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:12px;margin-bottom:12px}
.modal-header h3{margin:0 0 2px 0;font-size:1.15rem;font-weight:700;color:#0f172a}
.sub-subtitle{font-size:0.75rem;color:#64748b}
.header-actions{display:flex;align-items:center;gap:12px}
.btn-close{background:none;border:none;font-size:1rem;color:#64748b;cursor:pointer}
.modal-body-stack{display:flex;flex-direction:column;gap:16px}

/* Horizontal Timeline Layout */
.stages-container{border-radius:8px;background:#f8fafc;padding:16px 12px;width:100%;box-sizing:border-box;overflow-x:auto}
.timeline-horizontal-wrapper{position:relative;display:flex;flex-wrap:nowrap;justify-content:space-between;align-items:flex-start;width:100%;padding:10px 0;box-sizing:border-box}
.timeline-line-horizontal{position:absolute;top:25px;left:5%;right:5%;height:2px;background:#bbf7d0;z-index:0}
.timeline-item-h{position:relative;display:flex;flex-direction:column;align-items:center;flex:1;min-width:140px;padding:0 6px;gap:12px;box-sizing:border-box}
.timeline-node-h{width:14px;height:14px;background:#16a34a;border:2px solid #fff;border-radius:50%;z-index:1;box-shadow:0 0 0 2px #dcfce7;margin-top:18px;flex-shrink:0}
.timeline-content-h{background:#fff;border-radius:8px;padding:10px;width:100%;box-shadow:0 2px 6px rgba(0,0,0,0.03);display:flex;flex-direction:column;gap:6px;box-sizing:border-box}
.timeline-header-h{display:flex;justify-content:space-between;align-items:flex-start;gap:6px}
.stage-name{font-weight:700;font-size:0.78rem;color:#0f172a;line-height:1.25;word-break:break-word;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.dafi-badge{background:#ecfdf5;color:#047857;font-size:0.62rem;font-weight:700;padding:2px 5px;border-radius:4px;width:fit-content;white-space:nowrap}

.pest-targets{display:flex;flex-direction:column;gap:2px;font-size:0.68rem}
.pest-label{color:#64748b;font-weight:600}
.pest-chips{display:flex;gap:3px;flex-wrap:wrap}
.pest-chip{background:#f1f5f9;color:#334155;padding:1px 5px;border-radius:3px;font-size:0.62rem;font-weight:600;white-space:nowrap}
.no-pest-text{color:#94a3b8;font-size:0.65rem}
.btn-delete-stage{background:none;border:none;color:#94a3b8;cursor:pointer;font-size:0.75rem;padding:0;flex-shrink:0}
.btn-delete-stage:hover{color:#ef4444}

/* Nested Modal Styling */
.nested-modal-backdrop{position:fixed;inset:0;background:rgba(15,23,42,0.4);backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;z-index:60;padding:20px}
.nested-modal-card{background:#fff;border-radius:12px;width:100%;max-width:420px;padding:20px;box-shadow:0 20px 40px -10px rgba(0,0,0,0.2);display:flex;flex-direction:column;gap:12px}
.add-stage-form{display:flex;flex-direction:column;gap:10px}
.form-row-sub{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.form-group{display:flex;flex-direction:column;gap:3px}
.form-group label{font-size:0.7rem;font-weight:700;color:#475569;text-transform:uppercase}
.form-group input{padding:8px 10px;border:none;border-radius:6px;font-size:0.82rem;outline:none;color:#0f172a;background:#f8fafc}
.form-group input:focus{background:#f1f5f9}

.modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:6px}
.btn-primary{padding:8px 14px;background:#16a34a;color:#fff;border:none;border-radius:6px;font-size:0.82rem;font-weight:600;cursor:pointer;transition:background 0.15s}
.btn-primary:hover{background:#15803d}
.btn-secondary{padding:8px 14px;background:#f8fafc;color:#334155;border:none;border-radius:6px;font-size:0.82rem;font-weight:600;cursor:pointer}
.btn-secondary:hover{background:#f1f5f9}
.no-results,.empty-state{text-align:center;color:#64748b;padding:20px 0;font-size:0.8rem}
</style>