<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="closeModal">
    <div class="modal-card wide-modal">
      <!-- Modal Header -->
      <div class="modal-header">
        <div>
          <h3 class="emphasized-brand-name">{{ chemical?.trade_name }}</h3>
          <span class="sub-subtitle">
            Active Ingredient: {{ chemical?.active_ingredient }} (IRAC Group {{ chemical?.sub_group }})
          </span>
        </div>
        <button @click="closeModal" class="btn-close-enhanced" title="Close modal" aria-label="Close modal">
          <span>✕</span>
        </button>
      </div>

      <div class="modal-content-stack" v-if="localChemical">
        <!-- Top Section: N/A Placeholder Image (Left) + Input Parameters / Details (Right) -->
        <div class="product-details-grid">
          <div class="product-image-box">
            <span class="image-placeholder-text">N/A</span>
          </div>

          <div class="info-table-wrap">
            <table class="info-table">
              <tbody>
                <tr><td class="label-cell">Category</td><td class="value-cell">{{ localChemical.category || 'N/A' }}</td></tr>
                <tr><td class="label-cell">Sub-group & Class</td><td class="value-cell">Subgroup {{ localChemical.sub_group }}</td></tr>
                <tr><td class="label-cell">Application Type</td><td class="value-cell">{{ localChemical.application_type || 'Contact' }}</td></tr>
                <tr>
                  <td class="label-cell">Target Pests</td>
                  <td class="value-cell">
                    <div v-if="localChemical.target_pests && localChemical.target_pests.length > 0" class="modal-pest-chips">
                      <span v-for="(pest, pIdx) in localChemical.target_pests" :key="pIdx" class="pest-chip-item">
                        {{ pest }}
                      </span>
                    </div>
                    <span v-else class="empty-text">No target pests specified</span>
                  </td>
                </tr>
                <tr><td class="label-cell">Package Price (₱)</td><td class="value-cell edit-cell"><input v-model.number="localChemical.package_price" type="number" step="1" class="form-input-uniform" /></td></tr>
                <tr>
                  <td class="label-cell">Package Size</td>
                  <td class="value-cell edit-cell">
                    <div class="dosage-edit-wrap">
                      <input v-model.number="localChemical.package_size" type="number" step="0.1" class="form-input-uniform" />
                      <input v-model="localChemical.unit_type" type="text" class="form-input-unit" placeholder="unit" />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class="label-cell">Dosage Rate per Knapsack</td>
                  <td class="value-cell edit-cell">
                    <div class="dosage-edit-wrap">
                      <input v-model.number="localChemical.dosage_per_knapsack" type="number" step="0.1" class="form-input-uniform" />
                      <span class="unit-text">{{ localChemical.unit_type }}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div class="update-action-box">
              <button type="button" @click="saveChemicalChanges" class="btn-primary-full">
                {{ saving ? 'Saving...' : 'Update Chemical Parameters' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Bottom Section: Operation Computation -->
        <div class="calc-section-card">
          <div class="calc-section-header">
            <h4 class="calc-section-title">Operation Computation</h4>
          </div>
          
          <div class="calc-body-padding">
            <div class="calc-inputs-stack">
              <!-- Farm & Block Selectors -->
              <div class="form-row-grid">
                <div class="form-group">
                  <select v-model="selectedFarmId" @change="onFarmChange" class="form-input">
                    <option value="" disabled>-- Select Farm --</option>
                    <option v-for="farm in farmsList" :key="farm.id" :value="farm.id">
                      {{ farm.name || farm.farm_name }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <div class="input-row-group">
                    <select v-model="selectedBlockId" @change="onBlockSelected" class="form-input" :disabled="!selectedFarmId">
                      <option value="" disabled>-- Select Block --</option>
                      <option v-for="block in blocksList" :key="block.id" :value="block.id">
                        {{ block.block_code || block.block_name }} ({{ block.tree_count || 0 }} trees)
                      </option>
                    </select>
                    <input v-model.number="calc.targetTrees" type="number" min="1" placeholder="Trees" class="form-input-uniform" />
                  </div>
                </div>
              </div>

              <div class="form-row-grid">
                <div class="form-group">
                  <label>Water Volume per Tree</label>
                  <div class="input-row-group">
                    <select v-model="waterPreset" @change="onWaterPresetChange" class="form-input">
                      <option value="10">Low (10L)</option>
                      <option value="25">Mid (25L)</option>
                      <option value="40">High (40L)</option>
                      <option value="custom">Custom L</option>
                    </select>
                    <div class="unit-input-wrap">
                      <input v-model.number="calc.waterPerTree" type="number" step="1" min="1" class="form-input-uniform" />
                      <span class="suffix-text">L/tree</span>
                    </div>
                  </div>
                </div>

                <div class="form-group">
                  <label>Application Equipment</label>
                  <div class="input-row-group">
                    <select v-model="equipmentPreset" @change="onEquipmentPresetChange" class="form-input">
                      <option value="200">Drum (200L)</option>
                      <option value="16">Knapsack (16L)</option>
                      <option value="custom">Custom L</option>
                    </select>
                    <div class="unit-input-wrap">
                      <input v-model.number="calc.equipmentVolume" type="number" step="1" min="1" class="form-input-uniform" />
                      <span class="suffix-text">L/tank</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="calc-summary-preview">
              <div class="summary-row"><span>Total Water Needed:</span><span>{{ totalWaterVolume }} Liters</span></div>
              <div class="summary-row"><span>Equivalent Tanks/Drums:</span><span>{{ totalTanksNeeded }} Units</span></div>
              <div class="summary-row"><span>Chemical Rate per Tank:</span><span>{{ chemicalPerTank }} {{ localChemical.unit_type }} / {{ calc.equipmentVolume }}L Tank</span></div>
              <div class="summary-row"><span>Total Pure Chemical Required:</span><span>{{ totalPureChemicalRequired }} {{ localChemical.unit_type }}</span></div>
              <div class="summary-row"><span>Packages Needed:</span><span>{{ packagesNeeded }} Units</span></div>
              <div class="summary-row summary-total">
                <span class="cost-label">Estimated Cost:</span>
                <span class="cost-value">₱{{ totalApplicationCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { supabase } from '../../providers/supabaseProvider.js';
import { farmService } from '../../services/farmService.js';
import { blockService } from '../../services/blockService.js';

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  chemical: { type: Object, default: null }
});

const emit = defineEmits(['close', 'updated']);

const localChemical = ref(null);
const farmsList = ref([]);
const blocksList = ref([]);
const selectedFarmId = ref('');
const selectedBlockId = ref('');
const saving = ref(false);

const waterPreset = ref('25');
const equipmentPreset = ref('200');
const calc = ref({ targetTrees: 1000, waterPerTree: 25, equipmentVolume: 200 });

watch(() => props.chemical, (newVal) => {
  if (newVal) localChemical.value = { ...newVal };
}, { immediate: true });

async function loadFarms() {
  try {
    farmsList.value = await farmService.getFarms() || [];
  } catch (err) {
    console.error('Failed to load farms:', err.message);
  }
}

async function onFarmChange() {
  selectedBlockId.value = '';
  blocksList.value = [];
  if (!selectedFarmId.value) return;
  try {
    blocksList.value = await blockService.getBlocksByFarm(selectedFarmId.value) || [];
  } catch (err) {
    console.error('Failed to load blocks for farm:', err.message);
  }
}

function onBlockSelected() {
  if (!selectedBlockId.value) return;
  const found = blocksList.value.find(b => b.id === selectedBlockId.value);
  if (found) {
    calc.value.targetTrees = found.tree_count || 100;
  }
}

function onWaterPresetChange() {
  if (waterPreset.value !== 'custom') calc.value.waterPerTree = parseFloat(waterPreset.value);
}

function onEquipmentPresetChange() {
  if (equipmentPreset.value !== 'custom') calc.value.equipmentVolume = parseFloat(equipmentPreset.value);
}

const totalWaterVolume = computed(() => (calc.value.targetTrees * calc.value.waterPerTree).toFixed(1));
const totalTanksNeeded = computed(() => calc.value.equipmentVolume ? (totalWaterVolume.value / calc.value.equipmentVolume).toFixed(2) : 0);

const chemicalPerTank = computed(() => {
  if (!localChemical.value) return 0;
  const dosageKnapsack = parseFloat(localChemical.value.dosage_per_knapsack) || 0;
  const tankVol = parseFloat(calc.value.equipmentVolume) || 16;
  return ((tankVol / 16) * dosageKnapsack).toFixed(2);
});

const totalPureChemicalRequired = computed(() => {
  if (!localChemical.value) return 0;
  const tanks = parseFloat(totalTanksNeeded.value) || 0;
  const chemPerTank = parseFloat(chemicalPerTank.value) || 0;
  return (tanks * chemPerTank).toFixed(2);
});

const packagesNeeded = computed(() => {
  if (!localChemical.value) return 0;
  return Math.ceil(parseFloat(totalPureChemicalRequired.value || 0) / (parseFloat(localChemical.value.package_size) || 1));
});

const totalApplicationCost = computed(() => packagesNeeded.value * (parseFloat(localChemical.value?.package_price) || 0));

async function saveChemicalChanges() {
  if (!localChemical.value) return;
  saving.value = true;
  try {
    const { error } = await supabase.from('ipm_inputs').update({
      package_price: localChemical.value.package_price,
      package_size: localChemical.value.package_size,
      unit_type: localChemical.value.unit_type,
      dosage_per_knapsack: localChemical.value.dosage_per_knapsack
    }).eq('id', localChemical.value.id);
    if (error) throw error;
    alert('Chemical parameters updated successfully!');
    emit('updated');
  } catch (err) { 
    alert('Failed to update chemical parameters: ' + err.message); 
  }
  finally { saving.value = false; }
}

function closeModal() { emit('close'); }
onMounted(() => { loadFarms(); });
</script>

<style scoped>
.modal-backdrop{position:fixed;inset:0;background:rgba(15,23,42,0.5);display:flex;align-items:center;justify-content:center;z-index:50}
.modal-card.wide-modal{background:#fff;border-radius:8px;width:100%;max-width:880px;padding:0;border:1px solid #cbd5e1;box-shadow:0 10px 25px -5px rgba(0,0,0,0.1);color:#000;text-align:left;box-sizing:border-box;overflow:hidden}
.modal-header{display:flex;justify-content:space-between;align-items:flex-start;background:#f0fdf4;padding:16px 20px;border-bottom:1px solid #bbf7d0}
.emphasized-brand-name{margin:0 0 2px 0;font-size:1.4rem;font-weight:700;color:#0f172a;letter-spacing:-0.01em}
.sub-subtitle{font-size:0.825rem;color:#475569}
.btn-close-enhanced{background:#fff;border:1px solid #cbd5e1;border-radius:6px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:0.85rem;color:#475569;cursor:pointer;transition:all 0.15s ease}
.btn-close-enhanced:hover{background:#f8fafc;color:#0f172a;border-color:#94a3b8}
.modal-content-stack{display:flex;flex-direction:column;gap:16px;padding:20px}
.product-details-grid{display:grid;grid-template-columns:260px 1fr;gap:16px;align-items:stretch}
.product-image-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;display:flex;align-items:center;justify-content:center;min-height:180px}
.image-placeholder-text{font-size:2.5rem;color:#cbd5e1}
.info-table-wrap{border:1px solid #cbd5e1;border-radius:6px;overflow:hidden;background:#fff;display:flex;flex-direction:column}
.info-table{width:100%;border-collapse:collapse;font-size:0.85rem;flex:1}
.info-table td{padding:6px 12px;border-bottom:1px solid #e2e8f0}
.label-cell{color:#475569;width:42%;background:#f8fafc;border-right:1px solid #e2e8f0}
.value-cell{color:#0f172a}
.modal-pest-chips{display:flex;flex-wrap:wrap;gap:4px}
.pest-chip-item{background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;padding:2px 6px;border-radius:4px;font-size:0.75rem;font-weight:600}
.empty-text{color:#94a3b8;font-style:italic;font-size:0.8rem}
.dosage-edit-wrap{display:flex;align-items:center;gap:6px}
.form-input-uniform{width:90px;padding:4px 6px;border:1px solid #cbd5e1;border-radius:4px;font-size:0.85rem;text-align:right;color:#0f172a;outline:none;box-sizing:border-box}
.form-input-unit{width:50px;padding:4px 6px;border:1px solid #cbd5e1;border-radius:4px;font-size:0.85rem;color:#0f172a;outline:none}
.form-input-uniform:focus,.form-input-unit:focus{border-color:#16a34a}
.unit-text{font-size:0.8rem;color:#64748b}
.update-action-box{padding:8px 12px;background:#f8fafc;border-top:1px solid #e2e8f0}
.btn-primary-full{width:100%;padding:6px 12px;background:#16a34a;color:#fff;border:none;border-radius:4px;font-size:0.8rem;font-weight:600;cursor:pointer}
.btn-primary-full:hover{background:#15803d}
.calc-section-card{border:1px solid #cbd5e1;border-radius:6px;background:#fff;display:flex;flex-direction:column;overflow:hidden}
.calc-section-header{background:#f0fdf4;border-bottom:1px solid #bbf7d0;padding:10px 16px;width:100%;box-sizing:border-box}
.calc-section-title{margin:0;font-size:0.925rem;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:0.02em}
.calc-body-padding{padding:16px;display:flex;flex-direction:column;gap:12px}
.calc-inputs-stack{display:flex;flex-direction:column;gap:12px}
.form-row-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.form-group{display:flex;flex-direction:column;gap:4px}
.form-group label{font-size:0.75rem;color:#475569;text-transform:uppercase}
.form-input{padding:6px 8px;border:1px solid #cbd5e1;border-radius:4px;font-size:0.85rem;background:#fff;color:#0f172a;outline:none;flex:1;box-sizing:border-box}
.form-input:focus{border-color:#16a34a}
.input-row-group{display:flex;gap:8px;align-items:center}
.unit-input-wrap{display:flex;align-items:center;gap:4px}
.suffix-text{font-size:0.75rem;color:#64748b;white-space:nowrap}
.calc-summary-preview{display:flex;flex-direction:column;gap:6px;background:#f8fafc;border:1px solid #e2e8f0;padding:10px 12px;border-radius:4px;font-size:0.85rem;color:#334155;margin-top:4px}
.summary-row{display:flex;justify-content:space-between;align-items:center}
.summary-total{border-top:1px solid #cbd5e1;padding:8px 10px;margin-top:2px;background:#f0fdf4;border-radius:4px;border:1px solid #bbf7d0}
.cost-label{font-weight:700;color:#166534}
.cost-value{font-size:0.95rem;font-weight:700;color:#15803d}
</style>