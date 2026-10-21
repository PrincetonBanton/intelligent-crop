<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="close">
    <div class="modal-card">
      <div class="modal-header">
        <div>
          <h3>Assign IPM Chemical (Slot {{ slotNumber }})</h3>
          <span class="sub-subtitle">Stage: {{ stage?.stage_name }}</span>
        </div>
        <button @click="close" class="btn-close">✕</button>
      </div>

      <div class="modal-body-stack">
        <!-- Target Pests Reminder -->
        <div class="pest-target-banner">
          <span class="banner-label">Target Pests for this Stage:</span>
          <div class="pest-chips">
            <span v-for="(pest, idx) in stage?.target_pests" :key="idx" class="pest-chip">{{ pest }}</span>
          </div>
        </div>

        <!-- Chemical Selection List -->
        <div class="chemical-selector-list">
          <div v-if="loading" class="no-results">Loading IPM roster...</div>
          <div v-else-if="chemicals.length === 0" class="empty-state">
            <p>No chemicals found in roster.</p>
          </div>
          <div 
            v-for="chem in chemicals" 
            :key="chem.id" 
            class="chem-select-card"
            @click="selectChemical(chem)"
          >
            <div class="chem-info">
              <span class="chem-name">{{ chem.trade_name || chem.name }}</span>
              <span class="chem-meta">{{ chem.active_ingredient }} • Mode of Action: <b>{{ chem.moa_category }}</b></span>
            </div>
            <div class="chem-action-indicator">Select &rarr;</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { supabase } from '../../providers/supabaseProvider.js';

const props = defineProps({
  isOpen: Boolean,
  stage: Object,
  slotNumber: Number
});

const emit = defineEmits(['close', 'assign']);

const chemicals = ref([]);
const loading = ref(false);

async function loadChemicals() {
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from('ipm_inputs')
      .select('*')
      .order('trade_name', { ascending: true });

    if (error) throw error;
    chemicals.value = data || [];
  } catch (err) {
    console.error('Failed to load IPM database:', err.message);
  } finally {
    loading.value = false;
  }
}

watch(() => props.isOpen, (val) => {
  if (val) loadChemicals();
});

function selectChemical(chem) {
  emit('assign', { stageId: props.stage.id, slotNumber: props.slotNumber, chemical: chem });
  close();
}

function close() {
  emit('close');
}
</script>

<style scoped>
.modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,0.5); display: flex; align-items: center; justify-content: center; z-index: 50; }
.modal-card { background: #fff; border-radius: 8px; width: 100%; max-width: 520px; padding: 24px; border: 1px solid #cbd5e1; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); text-align: left; box-sizing: border-box; }
.modal-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 12px; }
.modal-header h3 { margin: 0 0 2px 0; font-size: 1.1rem; color: #0f172a; }
.sub-subtitle { font-size: 0.78rem; color: #64748b; }
.btn-close { background: none; border: none; font-size: 1rem; color: #64748b; cursor: pointer; }
.modal-body-stack { display: flex; flex-direction: column; gap: 12px; }
.pest-target-banner { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px; display: flex; flex-direction: column; gap: 4px; }
.banner-label { font-size: 0.7rem; font-weight: 700; color: #475569; text-transform: uppercase; }
.pest-chips { display: flex; gap: 4px; flex-wrap: wrap; }
.pest-chip { background: #dcfce7; color: #166534; padding: 1px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 600; }
.chemical-selector-list { display: flex; flex-direction: column; gap: 6px; max-height: 280px; overflow-y: auto; }
.chem-select-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: all 0.2s; }
.chem-select-card:hover { border-color: #16a34a; background: #f0fdf4; }
.chem-info { display: flex; flex-direction: column; gap: 2px; }
.chem-name { font-weight: 700; font-size: 0.85rem; color: #0f172a; }
.chem-meta { font-size: 0.72rem; color: #64748b; }
.chem-action-indicator { font-size: 0.75rem; font-weight: 700; color: #16a34a; }
.no-results, .empty-state { text-align: center; color: #64748b; padding: 20px 0; font-size: 0.8rem; }
</style>