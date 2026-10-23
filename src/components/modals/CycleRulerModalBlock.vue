<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="close">
    <div class="modal-card ruler-modal">
      <div class="modal-header">
        <div class="header-title-group">
          <div class="context-subtitle-bar">
            <span class="context-pill"><b>Farm:</b> {{ farm?.name || 'Main Plantation' }}</span>
            <span class="context-pill"><b>Block:</b> {{ block?.block_code || 'N/A' }}</span>
            <span class="context-pill"><b>Trees:</b> {{ block?.tree_count || 0 }} Units</span>
            <span class="context-pill"><b>Trigger:</b> {{ crop?.trigger_type || 'DAF' }}</span>
            <span class="context-pill"><b>Total Cycle:</b> {{ maxDays }} Days</span>
          </div>
        </div>
        <div class="header-right-group">
          <button @click="close" class="btn-close" title="Close">✕</button>
        </div>
      </div>

      <div class="modal-body">
        <div class="cycle-start-toolbar">
          <div class="date-picker-group">
            <label>Cycle Start Date (Day 0):</label>
            <input type="date" v-model="cycleStartDate" class="date-input" />
          </div>
        </div>

        <!-- CARD 1: Crop Phenology Stages Ruler -->
        <div class="ruler-card-section taller-card">
          <div class="section-card-header">
            <h4>Crop Stages</h4>
            <div class="header-right-actions">
              <span v-if="loadingStages" class="loading-tag">Loading...</span>
              <button @click="openAddStage" class="btn-sm-primary">+ Add Stage</button>
            </div>
          </div>
          <div class="ruler-container">
            <div class="details-track-area stages-details">
              <div v-if="!loadingStages && cropStages.length === 0" class="no-stages-msg">
                No stages configured for this template. Click "+ Add Stage" above to begin.
              </div>
              <div v-for="stage in cropStages" :key="stage.id" class="stage-block clickable-block" @click="openEditStage(stage)" title="Click to Edit or Delete Stage" :style="{ left: `${(stage.dafi_start / maxDays) * 100}%`, width: `${(Math.max(1, stage.dafi_end - stage.dafi_start) / maxDays) * 100}%` }">
                <span class="block-label" :title="stage.stage_name">{{ stage.stage_name }}</span>
                <span class="day-range-badge">Day {{ stage.dafi_start }} – {{ stage.dafi_end }}</span>
                <div class="pest-chips-container">
                  <span v-for="(pest, idx) in stage.target_pests" :key="idx" class="pest-chip">{{ pest }}</span>
                </div>
              </div>
            </div>

            <!-- Main Ruler Track -->
            <div class="ruler-track-line" @click="handleCropRulerClick">
              <div v-for="tick in rulerTicks" :key="'crop-' + tick" :class="['ruler-tick', tick % 10 === 0 ? 'tick-ten' : tick % 5 === 0 ? 'tick-five' : 'tick-one']" :style="{ left: `${(tick / maxDays) * 100}%` }">
                <span class="tick-label" v-if="tick % 10 === 0">Day {{ tick }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- CARD 2: Spray Interval Passes Ruler -->
        <div class="ruler-card-section taller-card">
          <div class="section-card-header">
            <h4>Spray Interval</h4>
          </div>
          <div class="ruler-container">
            <div class="details-track-area sprays-details">
              <div class="no-stages-msg">Click along the ruler track below to schedule a new spray pass.</div>
            </div>

            <!-- Main Ruler Track with Interactive Hover Tooltip & Click -->
            <div class="ruler-track-line interactive-track" @click="handleSprayRulerClick" @mousemove="handleSprayRulerHover" @mouseleave="hoveredDay = null">
              <div v-if="hoveredDay !== null" class="hover-day-tooltip" :style="{ left: `${hoverXPercent}%` }">
                Day {{ hoveredDay }} ({{ calculateCalendarDate(hoveredDay) }})
              </div>

              <div v-for="tick in rulerTicks" :key="'spray-' + tick" :class="['ruler-tick', tick % 10 === 0 ? 'tick-ten' : tick % 5 === 0 ? 'tick-five' : 'tick-one']" :style="{ left: `${(tick / maxDays) * 100}%` }">
                <span class="tick-label" v-if="tick % 10 === 0">Day {{ tick }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- CROP STAGE EDIT MODAL -->
    <CropStageModal :isOpen="showStageModal" :templateId="crop?.id" :stage="selectedStageForEdit" @close="showStageModal = false" @saved="fetchStagesForCrop" />

    <!-- STANDALONE SPRAY PASS CONFIG MODAL -->
    <SprayPassConfigModal 
      :isOpen="showSprayPassModal" 
      :passData="passForm" 
      :maxDays="maxDays"
      @close="showSprayPassModal = false" 
      @save="handleSaveSprayPass" 
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { supabase } from '../../providers/supabaseProvider.js';
import CropStageModal from './CropStageModal.vue';
import SprayPassConfigModal from './SprayPassConfigModal.vue';

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  crop: { type: Object, required: true },
  block: { type: Object, required: true },
  farm: { type: Object, required: true }
});

const emit = defineEmits(['close']);
const cropStages = ref([]);
const loadingStages = ref(false);
const showStageModal = ref(false);
const selectedStageForEdit = ref(null);
const hoveredDay = ref(null);
const hoverXPercent = ref(0);

const showSprayPassModal = ref(false);
const passForm = ref({});

const cycleStartDate = ref(
  props.block?.program_start_date 
    ? props.block.program_start_date 
    : new Date().toISOString().split('T')[0]
);

const maxDays = computed(() => props.crop?.expected_cycle_duration_days || 120);

const rulerTicks = computed(() => {
  const ticks = [];
  for (let i = 0; i <= maxDays.value; i++) {
    ticks.push(i);
  }
  return ticks;
});

function calculateCalendarDate(dayOffset) {
  if (!cycleStartDate.value) return '';
  const baseDate = new Date(cycleStartDate.value);
  baseDate.setDate(baseDate.getDate() + (dayOffset || 0));
  return baseDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

async function fetchStagesForCrop() {
  if (!props.crop?.id) return;
  loadingStages.value = true;
  try {
    let { data, error } = await supabase
      .from('crop_stages')
      .select('id, template_id, stage_name, dafi_start, dafi_end, target_pests')
      .eq('template_id', props.crop.id)
      .order('dafi_start', { ascending: true });

    if (error || !data || data.length === 0) {
      const res = await supabase
        .from('crop_stages')
        .select('id, stage_name, dafi_start, dafi_end, target_pests')
        .eq('crop_template_id', props.crop.id)
        .order('dafi_start', { ascending: true });
      data = res.data;
    }

    cropStages.value = data || [];
  } catch (err) {
    console.error('Error loading crop stages from database:', err.message);
  } finally {
    loadingStages.value = false;
  }
}

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    cycleStartDate.value = props.block?.program_start_date 
      ? props.block.program_start_date 
      : new Date().toISOString().split('T')[0];
    fetchStagesForCrop();
  }
}, { immediate: true });

function openAddStage() {
  selectedStageForEdit.value = null;
  showStageModal.value = true;
}

function openEditStage(stage) {
  selectedStageForEdit.value = stage;
  showStageModal.value = true;
}

function handleCropRulerClick(event) {
  const rect = event.currentTarget.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const percentage = Math.max(0, Math.min(1, clickX / rect.width));
  const calculatedDay = Math.round(percentage * maxDays.value);
  
  selectedStageForEdit.value = { dafi_start: calculatedDay, dafi_end: Math.min(maxDays.value, calculatedDay + 15), stage_name: '', target_pests: [] };
  showStageModal.value = true;
}

function handleSprayRulerHover(event) {
  const rect = event.currentTarget.getBoundingClientRect();
  const hoverX = event.clientX - rect.left;
  const percentage = Math.max(0, Math.min(1, hoverX / rect.width));
  
  hoverXPercent.value = percentage * 100;
  hoveredDay.value = Math.round(percentage * maxDays.value);
}

function handleSprayRulerClick(event) {
  const rect = event.currentTarget.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const percentage = Math.max(0, Math.min(1, clickX / rect.width));
  const calculatedDay = Math.round(percentage * maxDays.value);
  const targetDate = calculateCalendarDate(calculatedDay);
  
  const matchedStage = cropStages.value.find(
    stage => calculatedDay >= stage.dafi_start && calculatedDay <= stage.dafi_end
  );

  const stageName = matchedStage ? matchedStage.stage_name : 'N/A';
  const pestList = matchedStage?.target_pests && matchedStage.target_pests.length > 0
    ? matchedStage.target_pests.join(', ')
    : '';

  passForm.value = {
    farm: props.farm?.name || 'Main Plantation',
    block: props.block?.block_code || 'N/A',
    crop: props.crop?.crop_name || 'General Crop',
    tree_count: props.block?.tree_count || 0,
    start_date: cycleStartDate.value,
    day_offset: calculatedDay,
    application_date: targetDate,
    stage: stageName,
    target_pest: pestList,
    chemical_used: '',
    active_ingredient: '',
    irac_moa_group: '',
    dosage_per_tree: 0,
    unit_of_measure: 'ml',
    unit_cost: 0,
    total_cost: 0,
    status: 'Pending'
  };

  showSprayPassModal.value = true;
}

function handleSaveSprayPass(updatedPass) {
  console.log('Saved Spray Pass Payload:', updatedPass);
  showSprayPassModal.value = false;
}

function close() {
  emit('close');
}
</script>

<style scoped>
/* Main modal styles remain identical */
.modal-backdrop{position:fixed;inset:0;background:rgba(15,23,42,0.4);backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;z-index:60;padding:20px}
.modal-card.ruler-modal{background:#fff;border-radius:12px;width:100%;max-width:100%;height:88vh;padding:24px;box-shadow:0 20px 40px -10px rgba(0,0,0,0.15);display:flex;flex-direction:column;gap:16px;text-align:left;box-sizing:border-box;overflow:hidden}
.modal-header{display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid #e2e8f0;flex-shrink:0;gap:16px}
.header-title-group{display:flex;flex-direction:column;gap:6px;flex:1}
.header-right-group{display:flex;align-items:center;gap:16px}
.btn-close{background:none;border:none;font-size:1.1rem;color:#64748b;cursor:pointer;padding:4px}
.btn-close:hover{color:#0f172a}
.context-subtitle-bar{display:flex;align-items:center;flex-wrap:wrap;gap:8px}
.context-pill{background:#f8fafc;border:1px solid #e2e8f0;padding:2px 8px;border-radius:6px;font-size:0.75rem;color:#475569;white-space:nowrap}
.context-pill b{color:#0f172a;font-weight:600}
.cycle-start-toolbar{display:flex;justify-content:flex-start;align-items:center}
.date-picker-group{display:flex;align-items:center;gap:8px;font-size:0.78rem;font-weight:700;color:#0f172a}
.date-input{padding:5px 10px;border:1px solid #cbd5e1;border-radius:6px;font-size:0.78rem;background:#fff;color:#0f172a;outline:none;font-weight:600}
.modal-body{display:flex;flex-direction:column;gap:16px;flex:1;overflow-y:auto;padding-right:4px}
.ruler-card-section.taller-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;display:flex;flex-direction:column;gap:12px;flex:1;min-height:220px}
.section-card-header{display:flex;justify-content:space-between;align-items:center}
.section-card-header h4{margin:0;font-size:0.85rem;color:#0f172a;font-weight:700}
.header-right-actions{display:flex;align-items:center;gap:8px}
.loading-tag{font-size:0.7rem;color:#64748b;font-weight:600}
.btn-sm-primary{padding:4px 10px;background:#16a34a;color:#fff;border:none;border-radius:6px;font-size:0.75rem;font-weight:600;cursor:pointer}
.btn-sm-primary:hover{background:#15803d}
.ruler-container{position:relative;padding:85px 12px 45px 12px;background:#fff;border-radius:8px;border:1px solid #f1f5f9;margin-top:auto}
.ruler-track-line{position:relative;height:4px;background:#cbd5e1;border-radius:2px;cursor:pointer;margin:0 10px}
.interactive-track{height:4px;top:-4px}
.details-track-area{position:absolute;left:22px;right:22px;height:65px;top:10px}
.no-stages-msg{font-size:0.75rem;color:#64748b;text-align:center;padding-top:18px}
.stage-block{position:absolute;height:62px;background:#ecfdf5;border:1px solid #a7f3d0;color:#047857;border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4px 6px;box-sizing:border-box;gap:2px;overflow:hidden;cursor:pointer;transition:all 0.2s}
.stage-block:hover{border-color:#16a34a;box-shadow:0 4px 12px rgba(22,163,74,0.15);transform:translateY(-1px)}
.block-label{font-size:0.7rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%;text-align:center}
.day-range-badge{background:#dcfce7;color:#166534;font-size:0.56rem;font-weight:700;padding:1px 4px;border-radius:3px;white-space:nowrap}
.pest-chips-container{display:flex;gap:3px;flex-wrap:wrap;justify-content:center}
.pest-chip{background:#f1f5f9;color:#334155;font-size:0.58rem;font-weight:600;padding:1px 4px;border-radius:3px;white-space:nowrap}
.hover-day-tooltip{position:absolute;top:-28px;transform:translateX(-50%);background:#0f172a;color:#fff;font-size:0.68rem;font-weight:800;padding:2px 8px;border-radius:4px;white-space:nowrap;pointer-events:none;z-index:10;box-shadow:0 2px 6px rgba(0,0,0,0.2)}
.hover-day-tooltip::after{content:'';position:absolute;top:100%;left:50%;transform:translateX(-50%);border-width:4px;border-style:solid;border-color:#0f172a transparent transparent transparent}
.ruler-tick{position:absolute;top:8px;transform:translateX(-50%);width:1px;background:#94a3b8}
.tick-ten{height:16px;background:#475569;width:2px;z-index:2}
.tick-ten .tick-label{position:absolute;top:22px;left:50%;transform:translateX(-50%);font-size:0.65rem;color:#475569;white-space:nowrap;font-weight:700}
.tick-five{height:10px;background:#94a3b8;width:1.5px;z-index:1}
.tick-one{height:6px;background:#cbd5e1;width:1px;z-index:0}
</style>