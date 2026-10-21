<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="close">
    <div class="modal-card timeline-modal">
      <div class="modal-header">
        <div>
          <h3>Timeline Projection Preview</h3>
          <span class="sub-subtitle">
            Template: <b>{{ crop?.crop_name }}</b> ({{ crop?.variety }}) • Metric: <b>{{ crop?.trigger_type || 'DAFI' }}</b>
          </span>
        </div>
        <button @click="close" class="btn-close">✕</button>
      </div>

      <div class="modal-body">
        <!-- Date Anchor Selection Controls -->
        <div class="timeline-controls-bar">
          <div class="control-group">
            <label>Day 0 Anchor Date ({{ crop?.trigger_type || 'DAFI' }}):</label>
            <input v-model="anchorDate" type="date" class="date-input" />
          </div>
          <div class="stage-count-badge">
            <b>{{ stages.length }}</b> Stages Loaded
          </div>
        </div>

        <!-- Scrollable Horizontal Timeline Track -->
        <div class="timeline-scroll-wrapper">
          <div v-if="loading" class="loading-state">Loading timeline stages...</div>
          
          <div v-else-if="stages.length === 0" class="empty-state">
            <p>No phenological stages configured for this template yet. Click "Configure Stages" to seed or build stages.</p>
          </div>

          <div v-else class="timeline-grid-track">
            <div v-for="stage in stages" :key="stage.id" class="timeline-node-column">
              
              <!-- 3 Interactive Chemical Input Slots -->
              <div class="input-slots-stack">
                <div 
                  v-for="slotNum in [1, 2, 3]" 
                  :key="slotNum"
                  class="input-slot-box" 
                  @click="openChemicalSelector(stage, slotNum)"
                  title="Click to assign IPM chemical input"
                >
                  {{ getSlotLabel(stage.id, slotNum) }}
                </div>
              </div>

              <!-- Node Line Marker -->
              <div class="node-track-line">
                <div class="node-dot"></div>
              </div>

              <!-- Stage Phenological Card -->
              <div class="stage-info-card">
                <span class="stage-title">{{ stage.stage_name }}</span>
                <span class="dafi-badge">
                  {{ stage.dafi_start === stage.dafi_end ? `${stage.dafi_start} ${crop?.trigger_type || 'DAFI'}` : `${stage.dafi_start}-${stage.dafi_end} ${crop?.trigger_type || 'DAFI'}` }}
                </span>
                <span class="projected-date">
                  {{ formatStageDateRange(anchorDate, stage.dafi_start, stage.dafi_end) }}
                </span>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- IPM Chemical Selection Sub-Modal -->
    <AssignChemicalModal 
      :isOpen="showChemModal" 
      :stage="selectedStageForSlot" 
      :slotNumber="selectedSlotNum" 
      @close="showChemModal = false" 
      @assign="handleAssignChemical" 
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { supabase } from '../../providers/supabaseProvider.js';
import { formatStageDateRange } from '../../utils/dateUtils.js';
import AssignChemicalModal from './AssignChemicalModal.vue';

const props = defineProps({
  isOpen: Boolean,
  crop: Object
});

const emit = defineEmits(['close']);

const stages = ref([]);
const loading = ref(false);
const anchorDate = ref('2026-10-19'); // Default mock Day 0 date
const assignedSlots = ref({}); // Storage map for assigned slot chemicals: { 'stageId_slotNum': chemName }

const showChemModal = ref(false);
const selectedStageForSlot = ref(null);
const selectedSlotNum = ref(1);

async function loadStages() {
  if (!props.crop?.id) return;
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from('crop_stages')
      .select('*')
      .eq('template_id', props.crop.id)
      .order('dafi_start', { ascending: true });

    if (error) throw error;
    stages.value = data || [];
  } catch (err) {
    console.error('Failed to load stages for timeline:', err.message);
  } finally {
    loading.value = false;
  }
}

watch(() => props.isOpen, (val) => {
  if (val) loadStages();
});

function openChemicalSelector(stage, slotNum) {
  selectedStageForSlot.value = stage;
  selectedSlotNum.value = slotNum;
  showChemModal.value = true;
}

function handleAssignChemical({ stageId, slotNumber, chemical }) {
  const key = `${stageId}_${slotNumber}`;
  assignedSlots.value[key] = chemical.trade_name || chemical.name;
}

function getSlotLabel(stageId, slotNum) {
  const key = `${stageId}_${slotNum}`;
  return assignedSlots.value[key] || `Input Slot ${slotNum}`;
}

function close() {
  emit('close');
}
</script>

<style scoped>
.modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,0.5); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 50; }
.timeline-modal { background: #fff; border-radius: 12px; width: 92%; max-width: 1100px; padding: 20px 24px; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.2); display: flex; flex-direction: column; gap: 14px; text-align: left; max-height: 85vh; }
.modal-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0; }
.modal-header h3 { margin: 0; font-size: 1.15rem; color: #0f172a; font-weight: 700; }
.sub-subtitle { font-size: 0.8rem; color: #64748b; }
.btn-close { background: none; border: none; font-size: 1rem; color: #64748b; cursor: pointer; }

.timeline-controls-bar { display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; }
.control-group { display: flex; align-items: center; gap: 10px; font-size: 0.8rem; font-weight: 600; color: #334155; }
.date-input { padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.825rem; outline: none; background: #fff; color: #0f172a; }
.stage-count-badge { font-size: 0.75rem; color: #166534; background: #dcfce7; padding: 4px 10px; border-radius: 6px; font-weight: 700; }

.timeline-scroll-wrapper { overflow-x: auto; padding: 16px 4px 24px 4px; }
.timeline-grid-track { display: flex; gap: 16px; min-width: max-content; align-items: flex-start; position: relative; }
.timeline-grid-track::before { content: ''; position: absolute; top: 116px; left: 0; right: 0; height: 4px; background: #16a34a; z-index: 1; }

.timeline-node-column { display: flex; flex-direction: column; width: 145px; align-items: center; position: relative; z-index: 2; gap: 8px; }

.input-slots-stack { display: flex; flex-direction: column; gap: 4px; width: 100%; margin-bottom: 6px; }
.input-slot-box { background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 6px 4px; text-align: center; font-size: 0.7rem; color: #64748b; font-weight: 600; cursor: pointer; transition: all 0.2s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.input-slot-box:hover { border-color: #16a34a; color: #16a34a; background: #f0fdf4; }

.node-track-line { display: flex; justify-content: center; width: 100%; padding: 2px 0; }
.node-dot { width: 14px; height: 14px; background: #16a34a; border: 3px solid #dcfce7; border-radius: 50%; box-shadow: 0 0 0 2px #16a34a; }

.stage-info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; width: 100%; text-align: center; display: flex; flex-direction: column; gap: 4px; box-sizing: border-box; min-height: 95px; justify-content: flex-start; }
.stage-title { font-size: 0.78rem; font-weight: 700; color: #0f172a; line-height: 1.25; }
.dafi-badge { font-size: 0.68rem; font-weight: 700; color: #166534; background: #dcfce7; padding: 1px 6px; border-radius: 4px; align-self: center; }
.projected-date { font-size: 0.68rem; color: #475569; font-weight: 600; margin-top: auto; }

.loading-state, .empty-state { text-align: center; color: #64748b; padding: 40px 0; font-size: 0.85rem; width: 100%; }
</style>