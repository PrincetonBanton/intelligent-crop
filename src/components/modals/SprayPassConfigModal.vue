<template>
  <div v-if="isOpen" class="sub-modal-backdrop" @click.self="close">
    <div class="sub-modal-card wide-modal">
      <!-- Modal Header -->
      <div class="modal-header">
        <div>
          <h3>Configure Spray Pass & Costing</h3>
        </div>
        <button @click="close" class="btn-close-enhanced" title="Close modal">✕</button>
      </div>

      <div class="report-card-container">
        <!-- 2-Column Grid Layout for Context and Pass Details -->
        <div class="grid-columns">
          <!-- Left Column: General Context -->
          <div class="info-card-section">
            <div class="card-subtitle">General Context</div>
            <div class="info-row"><span class="info-label">Farm:</span> <span class="info-value">{{ formData.farm }}</span></div>
            <div class="info-row"><span class="info-label">Block:</span> <span class="info-value">{{ formData.block }}</span></div>
            <div class="info-row"><span class="info-label">Crop:</span> <span class="info-value">{{ formData.crop }}</span></div>
            <div class="info-row"><span class="info-label">Tree Count:</span> <span class="info-value">{{ formData.tree_count }} Units</span></div>
            <div class="info-row"><span class="info-label">Cycle Start Date:</span> <span class="info-value">{{ formData.start_date }}</span></div>
          </div>

          <!-- Right Column: Spray Pass Details -->
          <div class="info-card-section">
            <div class="card-subtitle">Pass Details</div>
            <div class="info-row"><span class="info-label">Day Offset (DAFI):</span> <span class="info-value">Day {{ formData.day_offset }}</span></div>
            <div class="info-row"><span class="info-label">Application Date:</span> <span class="info-value">{{ formData.application_date }}</span></div>
            <div class="info-row"><span class="info-label">Phenological Stage:</span> <span class="info-value">{{ formData.stage || 'N/A' }}</span></div>
            <div class="info-row"><span class="info-label">Target Pest / Disease:</span> <span class="info-value">{{ formData.target_pest || 'None Specified' }}</span></div>
          </div>
        </div>

        <!-- SECTION 3: Recommended Inputs for Pest & Disease -->
        <div class="info-card-section">
          <div class="section-header-row">
            <div class="card-subtitle">Section 3: Recommended Chemical Inputs (Pest & Disease Control)</div>
            <span v-if="loadingChemicals" class="loading-tag">Searching IPM Database...</span>
          </div>

          <div v-if="recommendedChemicals.length === 0 && !loadingChemicals" class="empty-text">
            No chemical matches found in `ipm_inputs` for target pest: <b>{{ formData.target_pest || 'None' }}</b>.
          </div>

          <div v-else class="chemical-table-container">
            <table class="chemical-recommendation-table">
              <thead>
                <tr>
                  <th>Trade Name</th>
                  <th>Active Ingredient</th>
                  <th>Sub-Group</th>
                  <th>Type</th>
                  <th>Target Pests</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="chem in recommendedChemicals" :key="chem.id" :class="{ 'selected-row': selectedChemical?.id === chem.id }">
                  <td><b>{{ chem.trade_name }}</b></td>
                  <td>{{ chem.active_ingredient }}</td>
                  <td><span class="moa-badge">{{ chem.sub_group }}</span></td>
                  <td><span class="type-badge">{{ chem.application_type || 'Contact' }}</span></td>
                  <td>
                    <span v-for="(p, idx) in chem.target_pests" :key="idx" class="pest-tag">{{ p }}</span>
                  </td>
                  <td>
                    <button type="button" @click="selectChemical(chem)" class="btn-sm-add">
                      {{ selectedChemical?.id === chem.id ? '✓ Selected' : 'Select for Calc' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- SECTION 4: Operation Computation -->
        <div class="calc-section-card" v-if="selectedChemical">
          <div class="calc-section-header">
            <h4 class="calc-section-title">Section 4: Operation computation summary ({{ selectedChemical.trade_name }})</h4>
          </div>
          
          <div class="calc-body-padding">
            <div class="calc-inputs-stack">
              <!-- Re-arranged 2-Column Grid Layout -->
              <div class="form-row-grid">
                <!-- Left Column -->
                <div class="calc-col-stack">
                  <div class="form-group">
                    <label>Water volume per tree</label>
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
                    <label>Package price and size</label>
                    <div class="input-row-group">
                      <input v-model.number="selectedChemical.package_price" type="number" step="1" class="form-input-uniform" placeholder="Price (₱)" title="Package Price" />
                      <input v-model.number="selectedChemical.package_size" type="number" step="0.1" class="form-input-uniform" placeholder="Size" title="Package Size" />
                      <input v-model="selectedChemical.unit_type" type="text" class="form-input-unit" placeholder="Unit" title="Unit Type" />
                    </div>
                  </div>
                </div>

                <!-- Right Column -->
                <div class="calc-col-stack">
                  <div class="form-group">
                    <label>Application equipment tank volume</label>
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

                  <div class="form-group">
                    <label>Dosage per knapsack</label>
                    <div class="input-row-group">
                      <input v-model.number="selectedChemical.dosage_per_knapsack" type="number" step="0.1" class="form-input-uniform" placeholder="Dosage" title="Dosage per 16L Knapsack" />
                      <span class="suffix-text">/ 16L tank</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Calculation Summary Preview -->
            <div class="calc-summary-preview">
              <div class="summary-row"><span>Total water needed:</span><span>{{ totalWaterVolume }} Liters</span></div>
              <div class="summary-row"><span>Equivalent tanks/drums:</span><span>{{ totalTanksNeeded }} Units</span></div>
              <div class="summary-row"><span>Chemical rate per tank:</span><span>{{ chemicalPerTank }} {{ selectedChemical.unit_type }} / {{ calc.equipmentVolume }}L Tank</span></div>
              <div class="summary-row"><span>Total pure chemical required:</span><span>{{ totalPureChemicalRequired }} {{ selectedChemical.unit_type }}</span></div>
              <div class="summary-row"><span>Packages needed:</span><span>{{ packagesNeeded }} Units</span></div>
              <div class="summary-row summary-total">
                <span class="cost-label">Estimated cost:</span>
                <span class="cost-value">₱{{ totalApplicationCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="info-card-section">
          <div class="card-subtitle">Section 4: Operation computation summary</div>
          <div class="empty-text">Select a chemical input from Section 3 above to load inventory package counts and cost computations.</div>
        </div>
      </div>

      <!-- Actions -->
      <div class="form-actions">
        <button type="button" @click="close" class="btn-secondary">Close</button>
        <button type="button" @click="handleSubmit" class="btn-primary">Save Pass Draft</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { supabase } from '../../providers/supabaseProvider.js';

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  passData: { type: Object, required: true },
  maxDays: { type: Number, default: 120 }
});

const emit = defineEmits(['close', 'save']);

const formData = ref({ ...props.passData });
const recommendedChemicals = ref([]);
const loadingChemicals = ref(false);
const selectedChemical = ref(null);

const waterPreset = ref('25');
const equipmentPreset = ref('200');
const calc = ref({ waterPerTree: 25, equipmentVolume: 200 });

watch(() => props.passData, async (newVal) => {
  formData.value = { ...newVal };
  selectedChemical.value = null;
  if (newVal.target_pest) {
    await fetchRecommendedChemicals(newVal.target_pest);
  }
}, { deep: true });

async function fetchRecommendedChemicals(targetPestQuery) {
  if (!targetPestQuery) {
    recommendedChemicals.value = [];
    return;
  }

  loadingChemicals.value = true;
  try {
    const { data, error } = await supabase.from('ipm_inputs').select('*');
    if (error) throw error;

    if (!data) {
      recommendedChemicals.value = [];
      return;
    }

    const queryKeywords = targetPestQuery
      .toLowerCase()
      .split(/,|\sand\s|\s+/)
      .map(k => k.trim())
      .filter(k => k.length > 2);

    if (queryKeywords.length === 0) {
      queryKeywords.push(targetPestQuery.toLowerCase().trim());
    }

    recommendedChemicals.value = data.filter(chem => {
      let pests = chem.target_pests || [];
      if (typeof pests === 'string') pests = [pests];

      return pests.some(dbPest => {
        const pestLower = dbPest.toLowerCase();
        return queryKeywords.some(keyword => pestLower.includes(keyword));
      });
    });
  } catch (err) {
    console.error('Error fetching IPM inputs:', err.message);
    recommendedChemicals.value = [];
  } finally {
    loadingChemicals.value = false;
  }
}

function selectChemical(chem) {
  selectedChemical.value = { ...chem };
}

function onWaterPresetChange() {
  if (waterPreset.value !== 'custom') calc.value.waterPerTree = parseFloat(waterPreset.value);
}

function onEquipmentPresetChange() {
  if (equipmentPreset.value !== 'custom') calc.value.equipmentVolume = parseFloat(equipmentPreset.value);
}

const totalWaterVolume = computed(() => {
  const trees = formData.value.tree_count || 0;
  return (trees * calc.value.waterPerTree).toFixed(1);
});

const totalTanksNeeded = computed(() => {
  return calc.value.equipmentVolume ? (totalWaterVolume.value / calc.value.equipmentVolume).toFixed(2) : 0;
});

const chemicalPerTank = computed(() => {
  if (!selectedChemical.value) return 0;
  const dosageKnapsack = parseFloat(selectedChemical.value.dosage_per_knapsack) || 0;
  const tankVol = parseFloat(calc.value.equipmentVolume) || 16;
  return ((tankVol / 16) * dosageKnapsack).toFixed(2);
});

const totalPureChemicalRequired = computed(() => {
  if (!selectedChemical.value) return 0;
  const tanks = parseFloat(totalTanksNeeded.value) || 0;
  const chemPerTank = parseFloat(chemicalPerTank.value) || 0;
  return (tanks * chemPerTank).toFixed(2);
});

const packagesNeeded = computed(() => {
  if (!selectedChemical.value) return 0;
  const pkgSize = parseFloat(selectedChemical.value.package_size) || 1;
  return Math.ceil(parseFloat(totalPureChemicalRequired.value || 0) / pkgSize);
});

const totalApplicationCost = computed(() => {
  if (!selectedChemical.value) return 0;
  return packagesNeeded.value * (parseFloat(selectedChemical.value.package_price) || 0);
});

function handleSubmit() {
  const payload = {
    ...formData.value,
    selected_chemical: selectedChemical.value ? {
      id: selectedChemical.value.id,
      trade_name: selectedChemical.value.trade_name,
      active_ingredient: selectedChemical.value.active_ingredient,
      sub_group: selectedChemical.value.sub_group,
      dosage_per_knapsack: selectedChemical.value.dosage_per_knapsack,
      package_size: selectedChemical.value.package_size,
      unit_type: selectedChemical.value.unit_type,
      packages_needed: packagesNeeded.value,
      total_cost: totalApplicationCost.value
    } : null
  };
  emit('save', payload);
}

function close() {
  emit('close');
}
</script>

<style scoped>
.sub-modal-backdrop{position:fixed;inset:0;background:rgba(15,23,42,0.45);backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;z-index:70;padding:20px}
.sub-modal-card.wide-modal{background:#fff;border-radius:12px;width:100%;max-width:980px;height:90vh;max-height:92vh;padding:24px;border:1px solid #e2e8f0;box-shadow:0 20px 25px -5px rgba(0,0,0,0.1);text-align:left;box-sizing:border-box;display:flex;flex-direction:column}

.modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;border-bottom:1px solid #f1f5f9;padding-bottom:10px;flex-shrink:0}
.modal-header h3{margin:0;font-size:1.1rem;color:#0f172a;font-weight:700}
.btn-close-enhanced{background:none;border:none;font-size:1rem;color:#64748b;cursor:pointer;padding:4px}
.btn-close-enhanced:hover{color:#0f172a}

.report-card-container{display:flex;flex-direction:column;gap:14px;overflow-y:auto;padding-right:8px;padding-bottom:15px;flex:1;min-height:0;box-sizing:border-box}

.grid-columns{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.info-card-section{background:#f8fafc;padding:14px 18px;border-radius:8px;display:flex;flex-direction:column;gap:10px}
.section-header-row{display:flex;justify-content:space-between;align-items:center}
.card-subtitle{font-size:0.75rem;font-weight:normal;color:#64748b;text-transform:none;letter-spacing:normal}
.loading-tag{font-size:0.75rem;color:#16a34a;font-weight:normal}

.info-row{display:grid;grid-template-columns:155px 1fr;align-items:center;font-size:0.78rem;font-weight:normal;gap:8px}
.info-label{color:#64748b;text-transform:none;letter-spacing:normal;font-size:0.78rem;white-space:nowrap}
.info-value{color:#0f172a;font-weight:normal;word-break:break-word}

.empty-text{font-size:0.78rem;color:#64748b;padding:8px 0;font-style:italic}

/* Chemical Recommendation Table Styles */
.chemical-table-container{overflow-x:auto}
.chemical-recommendation-table{width:100%;border-collapse:collapse;font-size:0.78rem;text-align:left}
.chemical-recommendation-table th{background:#e2e8f0;color:#334155;padding:8px 10px;font-weight:normal;text-transform:none;font-size:0.78rem}
.chemical-recommendation-table td{padding:8px 10px;border-bottom:1px solid #e2e8f0;color:#0f172a;vertical-align:middle;font-weight:normal}
.selected-row{background:#f0fdf4 !important}
.moa-badge{background:#dcfce7;color:#166534;padding:2px 6px;border-radius:4px;font-weight:normal;font-size:0.75rem}
.type-badge{background:#e0f2fe;color:#0369a1;padding:2px 6px;border-radius:4px;font-weight:normal;font-size:0.75rem}
.pest-tag{display:inline-block;background:#f1f5f9;color:#334155;padding:1px 5px;border-radius:3px;font-size:0.75rem;margin:1px;font-weight:normal}
.btn-sm-add{background:#16a34a;color:#fff;border:none;padding:5px 10px;border-radius:4px;font-size:0.75rem;font-weight:normal;cursor:pointer}
.btn-sm-add:hover{background:#15803d}

/* Section 4 Computation Styles */
.calc-section-card{border:1px solid #cbd5e1;border-radius:8px;background:#fff;display:flex;flex-direction:column;margin-bottom:8px}
.calc-section-header{background:#f0fdf4;border-bottom:1px solid #bbf7d0;padding:10px 16px;width:100%;box-sizing:border-box;border-top-left-radius:8px;border-top-right-radius:8px}
.calc-section-title{margin:0;font-size:0.85rem;font-weight:normal;color:#0f172a;text-transform:none;letter-spacing:normal}
.calc-body-padding{padding:14px;display:flex;flex-direction:column;gap:12px}
.calc-inputs-stack{display:flex;flex-direction:column;gap:10px}
.form-row-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.calc-col-stack{display:flex;flex-direction:column;gap:10px}
.form-group{display:flex;flex-direction:column;gap:4px}
.form-group label{font-size:0.75rem;color:#475569;text-transform:none;font-weight:normal}
.form-input{padding:6px 8px;border:1px solid #cbd5e1;border-radius:4px;font-size:0.8rem;background:#fff;color:#0f172a;outline:none;box-sizing:border-box;font-weight:normal}
.form-input:focus{border-color:#16a34a}
.input-row-group{display:flex;gap:6px;align-items:center}
.form-input-uniform{width:90px;padding:5px 6px;border:1px solid #cbd5e1;border-radius:4px;font-size:0.8rem;text-align:right;color:#0f172a;outline:none;box-sizing:border-box;font-weight:normal}
.form-input-unit{width:50px;padding:5px 4px;border:1px solid #cbd5e1;border-radius:4px;font-size:0.8rem;color:#0f172a;text-align:center;outline:none;font-weight:normal}
.unit-input-wrap{display:flex;align-items:center;gap:4px}
.suffix-text{font-size:0.75rem;color:#64748b;white-space:nowrap;font-weight:normal}

.calc-summary-preview{display:flex;flex-direction:column;gap:6px;background:#f8fafc;border:1px solid #e2e8f0;padding:10px 14px;border-radius:6px;font-size:0.8rem;color:#334155;margin-top:4px}
.summary-row{display:flex;justify-content:space-between;align-items:center;font-weight:normal}
.summary-total{border-top:1px solid #bbf7d0;padding-top:6px;margin-top:2px;background:#f0fdf4;border-radius:4px;padding:6px 8px;border:1px solid #bbf7d0;font-weight:normal}
.cost-label{font-weight:normal;color:#166534}
.cost-value{font-size:0.95rem;font-weight:normal;color:#15803d}

.form-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:10px;padding-top:10px;border-top:1px solid #f1f5f9;flex-shrink:0}
.btn-primary, .btn-secondary{padding:7px 16px;border-radius:6px;font-weight:normal;font-size:0.8rem;cursor:pointer;border:none;transition:background 0.2s}
.btn-primary{background:#16a34a;color:#fff}
.btn-primary:hover{background:#15803d}
.btn-secondary{background:#f8fafc;color:#475569;border:1px solid #cbd5e1}
.btn-secondary:hover{background:#f1f5f9;color:#0f172a}
</style>