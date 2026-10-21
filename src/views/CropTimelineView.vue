<template>
  <div class="timeline-dashboard">
    <div class="timeline-header-card">
      <div>
        <h3>Active Block Timeline Projection</h3>
        <span class="sub-subtitle">Dynamic calendar mapping based on Day 0 Flower Induction anchor.</span>
      </div>
      <div class="anchor-date-group">
        <label>Day 0 Anchor Date:</label>
        <input v-model="cycleStartDate" type="date" @change="updateAnchorDate" class="date-input" />
      </div>
    </div>

    <!-- Horizontal Timeline Scroll Container -->
    <div class="timeline-scroll-wrapper">
      <div v-if="loading" class="no-results">Loading operational timeline...</div>
      <div v-else-if="stages.length === 0" class="empty-state">
        <p>No phenological stages found for this crop template. Please configure stages in Step 2 first.</p>
      </div>
      
      <div v-else class="timeline-grid-track">
        <div v-for="stage in stages" :key="stage.id" class="timeline-node-column">
          
          <!-- 3 Static Chemical Input Slots -->
          <div class="input-slots-stack">
            <div class="input-slot-box" title="Click to assign IPM chemical input">Input Slot 1</div>
            <div class="input-slot-box" title="Click to assign IPM chemical input">Input Slot 2</div>
            <div class="input-slot-box" title="Click to assign IPM chemical input">Input Slot 3</div>
          </div>

          <!-- Timeline Node Marker -->
          <div class="node-track-line">
            <div class="node-dot"></div>
          </div>

          <!-- Stage Details & Projected Dates -->
          <div class="stage-info-card">
            <span class="stage-title">{{ stage.stage_name }}</span>
            <span class="dafi-counter">{{ stage.dafi_start === stage.dafi_end ? `${stage.dafi_start} DAFI` : `${stage.dafi_start}-${stage.dafi_end} DAFI` }}</span>
            <span class="projected-date-text">
              {{ formatStageDateRange(cycleStartDate, stage.dafi_start, stage.dafi_end) }}
            </span>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../providers/supabaseProvider.js';
import { formatStageDateRange } from '../utils/dateUtils.js';

const props = defineProps({
  templateId: {
    type: String,
    required: true,
    default: '6dd97e9b-43ee-4b51-9812-5f6f0f6a88c4' // Defaults to our Mango template UUID
  }
});

const stages = ref([]);
const loading = ref(true);
const cycleStartDate = ref('2026-10-19'); // Default mock Day 0 anchor date matching your preview

async function loadTimelineStages() {
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from('crop_stages')
      .select('*')
      .eq('template_id', props.templateId)
      .order('dafi_start', { ascending: true });

    if (error) throw error;
    stages.value = data || [];
  } catch (err) {
    console.error('Failed to load timeline stages:', err.message);
  } finally {
    loading.value = false;
  }
}

function updateAnchorDate() {
  // Triggers reactivity update for calendar projections
}

onMounted(() => {
  loadTimelineStages();
});
</script>

<style scoped>
.timeline-dashboard { display: flex; flex-direction: column; gap: 16px; text-align: left; background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; box-sizing: border-box; }
.timeline-header-card { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; }
.timeline-header-card h3 { margin: 0; font-size: 1.1rem; color: #0f172a; font-weight: 700; }
.sub-subtitle { font-size: 0.8rem; color: #64748b; }
.anchor-date-group { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; font-weight: 600; color: #334155; }
.date-input { padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.825px; outline: none; background: #f8fafc; color: #0f172a; }

.timeline-scroll-wrapper { overflow-x: auto; padding: 12px 4px 20px 4px; }
.timeline-grid-track { display: flex; gap: 16px; min-width: max-content; align-items: flex-start; position: relative; }
.timeline-grid-track::before { content: ''; position: absolute; top: 122px; left: 0; right: 0; height: 4px; background: #16a34a; z-index: 1; }

.timeline-node-column { display: flex; flex-direction: column; width: 140px; align-items: center; position: relative; z-index: 2; gap: 8px; }

.input-slots-stack { display: flex; flex-direction: column; gap: 4px; width: 100%; margin-bottom: 8px; }
.input-slot-box { background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 6px 4px; text-align: center; font-size: 0.7rem; color: #64748b; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.input-slot-box:hover { border-color: #16a34a; color: #16a34a; background: #f0fdf4; }

.node-track-line { display: flex; justify-content: center; width: 100%; padding: 4px 0; }
.node-dot { width: 14px; height: 14px; background: #16a34a; border: 3px solid #dcfce7; border-radius: 50%; box-shadow: 0 0 0 2px #16a34a; }

.stage-info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; width: 100%; text-align: center; display: flex; flex-direction: column; gap: 3px; box-sizing: border-box; min-height: 90px; justify-content: flex-start; }
.stage-title { font-size: 0.78rem; font-weight: 700; color: #0f172a; line-height: 1.2; }
.dafi-counter { font-size: 0.7rem; font-weight: 700; color: #166534; background: #dcfce7; padding: 1px 4px; border-radius: 4px; display: inline-block; align-self: center; }
.projected-date-text { font-size: 0.68rem; color: #475569; font-weight: 600; margin-top: auto; }

.no-results, .empty-state { text-align: center; color: #64748b; padding: 32px 0; font-size: 0.85rem; width: 100%; }
</style>