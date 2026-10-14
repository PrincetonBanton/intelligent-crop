<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="closeModal">
    <div class="modal-card wide-modal">
      <div class="modal-header">
        <div>
          <h3>{{ chemical?.trade_name }}</h3>
          <span class="sub-subtitle">Active Ingredient: <strong>{{ chemical?.active_ingredient }}</strong> (IRAC Group {{ chemical?.sub_group }})</span>
        </div>
        <button @click="closeModal" class="btn-close">✕</button>
      </div>

      <div class="modal-body-grid" v-if="localChemical">
        <!-- Left Column: Base Input Parameters & Editable Dosage -->
        <div class="info-section">
          <h4>Base Input Parameters</h4>
          <div class="info-row">
            <span>Category:</span>
            <strong>{{ localChemical.category }}</strong>
          </div>
          <div class="info-row">
            <span>Sub-group & Class:</span>
            <strong>Subgroup {{ localChemical.sub_group }}</strong>
          </div>
          <div class="info-row">
            <span>Application Type:</span>
            <strong>{{ localChemical.application_type || 'Contact' }}</strong>
          </div>
          <div class="info-row">
            <span>Package Price:</span>
            <strong>₱{{ Number(localChemical.package_price || 0).toLocaleString() }}</strong>
          </div>
          <div class="info-row">
            <span>Package Size:</span>
            <strong>{{ localChemical.package_size }} {{ localChemical.unit_type }}</strong>
          </div>

          <!-- Editable Dosage per Knapsack -->
          <div class="info-row edit-row">
            <span>Dosage per 16L Knapsack:</span>
            <div class="dosage-edit-wrap">
              <input 
                v-model.number="localChemical.dosage_per_knapsack" 
                @change="updateDosage"
                type="number" 
                step="0.1" 
                class="form-input-inline" 
              />
              <span class="unit-text">{{ localChemical.unit_type }}</span>
            </div>
          </div>

          <!-- Dynamic Dosage per Drum -->
          <div class="info-row highlight-row">
            <span>Dosage per 200L Drum (12.5x):</span>
            <strong>{{ dynamicDosagePerDrum }} {{ localChemical.unit_type }}</strong>
          </div>
        </div>

        <!-- Right Column: Operational Scale Selection -->
        <div class="calc-section">
          <h4>Operational Scale Computation</h4>
          
          <div class="calc-inputs">
            <div class="form-group">
              <label>Number of Target Trees</label>
              <input v-model.number="calc.targetTrees" type="number" min="1" class="form-input" />
            </div>
            <div class="form-group">
              <label>Spray Intensity</label>
              <select v-model="calc.sprayIntensity" class="form-input">
                <option value="Low">Low</option>
                <option value="Mid">Mid</option>
                <option value="Heavy">Heavy</option>
              </select>
            </div>
          </div>

          <!-- Placeholder for Future Step-by-Step Computations -->
          <div class="results-box">
            <div class="result-placeholder">
              <p>🎯 Operational calculations will be configured here step-by-step.</p>
              <small>Target Trees: <strong>{{ calc.targetTrees }}</strong> | Intensity: <strong>{{ calc.sprayIntensity }}</strong></small>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-actions">
        <button type="button" @click="closeModal" class="btn-secondary">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { supabase } from '../../providers/supabaseProvider.js';

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  chemical: { type: Object, default: null }
});

const emit = defineEmits(['close', 'updated']);

const localChemical = ref(null);

watch(() => props.chemical, (newVal) => {
  if (newVal) {
    localChemical.value = { ...newVal };
  }
}, { immediate: true });

const calc = ref({
  targetTrees: 100,
  sprayIntensity: 'Mid'
});

const dynamicDosagePerDrum = computed(() => {
  if (!localChemical.value) return 0;
  const knapsackVal = parseFloat(localChemical.value.dosage_per_knapsack) || 0;
  return (knapsackVal * 12.5).toFixed(1);
});

async function updateDosage() {
  if (!localChemical.value) return;
  try {
    const { error } = await supabase
      .from('ipm_inputs')
      .update({ dosage_per_knapsack: localChemical.value.dosage_per_knapsack })
      .eq('id', localChemical.value.id);

    if (error) throw error;
    emit('updated'); // Triggers parent component to refresh its list
  } catch (err) {
    console.error('Failed to update dosage rate:', err.message);
  }
}

function closeModal() {
  emit('close');
}
</script>

<style scoped>
.modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,0.5); display: flex; align-items: center; justify-content: center; z-index: 50; }
.modal-card.wide-modal { background: #fff; border-radius: 8px; width: 100%; max-width: 820px; padding: 28px; border: 1px solid #cbd5e1; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); color: #000; text-align: left; }
.modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 14px; }
.modal-header h3 { margin: 0 0 4px 0; font-size: 1.35rem; font-weight: 700; color: #0f172a; }
.sub-subtitle { font-size: 0.85rem; color: #64748b; }

.modal-body-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 20px; }
.info-section, .calc-section { display: flex; flex-direction: column; gap: 12px; background: #f8fafc; padding: 18px; border-radius: 6px; border: 1px solid #e2e8f0; }
.info-section h4, .calc-section h4 { margin: 0 0 8px 0; font-size: 0.9rem; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.03em; }

.info-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.88rem; color: #334155; padding: 6px 0; border-bottom: 1px dashed #cbd5e1; }
.edit-row { background: #fffbeb; padding: 6px 8px; border-radius: 4px; border-bottom: none; border: 1px solid #fde68a; }
.dosage-edit-wrap { display: flex; align-items: center; gap: 4px; }
.form-input-inline { width: 70px; padding: 4px 6px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.85rem; text-align: right; font-weight: bold; color: #0f172a; outline: none; }
.form-input-inline:focus { border-color: #16a34a; }
.unit-text { font-size: 0.8rem; color: #64748b; font-weight: 600; }

.highlight-row { background: #f0fdf4; padding: 6px 8px; border-radius: 4px; color: #166534; font-weight: bold; border-bottom: none; }

.calc-inputs { display: flex; gap: 12px; margin-bottom: 12px; }
.form-group { display: flex; flex-direction: column; gap: 6px; flex: 1; }
.form-group label { font-size: 0.78rem; font-weight: 700; color: #475569; text-transform: uppercase; }
.form-input { padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.88rem; outline: none; background: #fff; color: #000; width: 100%; box-sizing: border-box; }
.form-input:focus { border-color: #16a34a; }

.results-box { display: flex; flex-direction: column; justify-content: center; align-items: center; background: #fff; padding: 24px 16px; border-radius: 6px; border: 1px solid #cbd5e1; text-align: center; height: 100%; box-sizing: border-box; }
.result-placeholder { font-size: 0.85rem; color: #64748b; display: flex; flex-direction: column; gap: 8px; }
.result-placeholder p { margin: 0; font-weight: 600; color: #334155; }

.modal-actions { display: flex; justify-content: flex-end; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 16px; }
.btn-secondary { padding: 8px 16px; border-radius: 6px; font-weight: 600; font-size: 0.9rem; cursor: pointer; border: 1px solid #cbd5e1; background: #f1f5f9; color: #334155; }
.btn-secondary:hover { background: #e2e8f0; color: #0f172a; }
.btn-close { background: none; border: none; font-size: 1.1rem; color: #64748b; cursor: pointer; padding: 4px; }
.btn-close:hover { color: #000; }
</style>