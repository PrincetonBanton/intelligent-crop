<template>
  <div class="ipm-view">
    <!-- View Header -->
    <div class="view-header">
      <h2>IRAC Insecticide Resistance Management</h2>
      <div class="header-actions">
        <input v-model="searchQuery" type="text" placeholder="Filter Group, MoA, or Sub-group..." class="search-input" />
        <button @click="handleAddInputsClick" class="btn-primary">+ Add Inputs</button>
        <button @click="showActiveIngredients = !showActiveIngredients" class="btn-secondary-toggle">
          {{ showActiveIngredients ? 'Hide Generic' : 'Show AI' }}
        </button>
      </div>
    </div>

    <!-- IRAC Master Table Card -->
    <div class="card list-card">
      <div class="table-container">
        <table class="irac-table">
          <thead>
            <tr>
              <th style="width: 5%;">Group</th>
              <th style="width: 20%;">Mode of Action</th>
              <th style="width: 25%;">Subgroup Class</th>
              <th style="width: 50%;">Brand Name and AI</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="4" class="no-results">Loading IRAC master data...</td>
            </tr>

            <template v-else v-for="groupObj in groupedIracData" :key="groupObj.group">
              <template v-for="(sub, subIndex) in groupObj.subGroups" :key="sub.subGroup">
                <tr :class="{ 'group-bottom-border': subIndex === groupObj.subGroups.length - 1 }">
                  <td v-if="subIndex === 0" :rowspan="groupObj.subGroups.length" class="group-cell">{{ groupObj.group }}</td>
                  <td v-if="subIndex === 0" :rowspan="groupObj.subGroups.length" class="action-cell">{{ groupObj.actionType }}</td>

                  <td>
                    <div class="subgroup-cell">
                      <span class="subgroup-code">{{ sub.subGroup }}</span>
                      <span class="subgroup-name">{{ sub.chemicalClass }}</span>
                    </div>
                  </td>

                  <td>
                    <div class="column-content">
                      <div class="brands-section">
                        <div v-if="getMappedBrands(sub.subGroup).length > 0" class="brand-tags">
                          <div 
                            v-for="brand in getMappedBrands(sub.subGroup)" 
                            :key="brand.id" 
                            class="brand-tag-wrapper"
                          >
                            <span 
                              class="brand-tag clickable-tag"
                              @click="handleBrandClick(brand)"
                            >
                              <span class="brand-name">{{ brand.trade_name }}</span>
                              <small class="brand-ai">({{ brand.active_ingredient }})</small>
                            </span>

                            <!-- Hover Tooltip Dropping Down Below -->
                            <div class="brand-hover-tooltip">
                              <div class="tooltip-row">
                                <span class="tooltip-label">Type:</span>
                                <span :class="['type-badge', getTypeClass(brand.application_type)]">
                                  {{ brand.application_type || 'Contact' }}
                                </span>
                              </div>
                              <div class="tooltip-row pests-row">
                                <span class="tooltip-label">Targets:</span>
                                <div v-if="brand.target_pests && brand.target_pests.length > 0" class="tooltip-pests-list">
                                  <span v-for="(pest, pIdx) in brand.target_pests" :key="pIdx" class="pest-chip">
                                    {{ pest }}
                                  </span>
                                </div>
                                <span v-else class="empty-brand-slot">No targets specified</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <span v-else class="empty-brand-slot">NA</span>
                      </div>

                      <div v-if="showActiveIngredients" class="ai-reference-section">
                        <div class="ai-chips">
                          <span v-for="(ai, idx) in sub.activeIngredients" :key="idx" class="ai-chip">{{ ai }}</span>
                          <span v-if="!sub.activeIngredients || sub.activeIngredients.length === 0" class="empty-brand-slot">None listed</span>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </template>

            <tr v-if="!loading && groupedIracData.length === 0">
              <td colspan="4" class="no-results">No IRAC groups match your search filter.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <AddInputModal :is-open="showAddModal" @close="showAddModal = false" @saved="fetchData" />
    <ViewChemicalModal :isOpen="isViewModalOpen" :chemical="selectedChemical" @close="isViewModalOpen = false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { supabase } from '../providers/supabaseProvider.js';
import AddInputModal from '../components/modals/AddInputModal.vue';
import ViewChemicalModal from '../components/modals/ViewChemicalModal.vue';

const searchQuery = ref('');
const showActiveIngredients = ref(false);
const loading = ref(true); 
const iracMasterData = ref([]);
const registeredChemicals = ref([]);

const isViewModalOpen = ref(false);
const selectedChemical = ref(null);

function handleBrandClick(brand) {
  selectedChemical.value = brand;
  isViewModalOpen.value = true;
}

const showAddModal = ref(false);
function handleAddInputsClick() { showAddModal.value = true; }

function getTypeClass(type) {
  if (!type) return 'badge-contact';
  const val = type.toLowerCase();
  if (val.includes('systemic') && val.includes('translaminar')) return 'badge-systrans';
  if (val.includes('systemic') && val.includes('contact')) return 'badge-dual';
  if (val.includes('systemic')) return 'badge-systemic';
  if (val.includes('translaminar')) return 'badge-translaminar';
  return 'badge-contact';
}

async function fetchData() {
  loading.value = true;
  try {
    const [iracRes, chemRes] = await Promise.all([
      supabase.from('irac_master').select('*').order('irac_group', { ascending: true }),
      supabase.from('ipm_inputs').select('*')
    ]);

    if (iracRes.error) throw iracRes.error;
    iracMasterData.value = iracRes.data || [];
    if (!chemRes.error) registeredChemicals.value = chemRes.data || [];
  } catch (err) {
    console.error('Failed to load data:', err.message);
  } finally {
    loading.value = false;
  }
}

function getMappedBrands(subGroupCode) {
  return registeredChemicals.value.filter(c => c.sub_group === subGroupCode);
}

const groupedIracData = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  const filtered = iracMasterData.value.filter(item => {
    if (!q) return true;
    const brands = getMappedBrands(item.sub_group).map(b => `${b.trade_name} ${b.active_ingredient} ${b.application_type || ''} ${(b.target_pests || []).join(' ')}`).join(' ').toLowerCase();
    const ais = (item.active_ingredients || []).join(' ').toLowerCase();
    return (
      item.irac_group.toLowerCase().includes(q) ||
      item.action_type.toLowerCase().includes(q) ||
      item.sub_group.toLowerCase().includes(q) ||
      item.chemical_class.toLowerCase().includes(q) ||
      brands.includes(q) ||
      ais.includes(q)
    );
  });

  const groupMap = new Map();
  filtered.forEach(item => {
    const groupKey = item.irac_group;
    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, { group: item.irac_group, actionType: item.action_type, subGroups: [] });
    }
    const existing = groupMap.get(groupKey).subGroups;
    if (!existing.some(s => s.subGroup === item.sub_group)) {
      existing.push({ subGroup: item.sub_group, chemicalClass: item.chemical_class, activeIngredients: item.active_ingredients || [] });
    }
  });

  return Array.from(groupMap.values()).sort((a, b) => {
    const getNum = (val) => {
      const cleaned = val.replace(/[^0-9]/g, '');
      return cleaned ? parseInt(cleaned, 10) : 999;
    };
    const numA = getNum(a.group), numB = getNum(b.group);
    return numA !== numB ? numA - numB : a.group.localeCompare(b.group);
  });
});

onMounted(() => { fetchData(); });
</script>

<style scoped>
.ipm-view{display:flex;flex-direction:column;gap:16px;text-align:left;background:#fff;margin:0;padding:0;width:100%;box-sizing:border-box}
.view-header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e2e8f0;padding-bottom:12px;gap:16px;flex-wrap:wrap}
.view-header h2{margin:0;font-size:1.25rem;font-weight:normal;color:#000}
.header-actions{display:flex;align-items:center;gap:10px}
.search-input{padding:6px 10px;border:1px solid #cbd5e1;border-radius:4px;font-size:0.85rem;width:220px;outline:none;color:#000;font-weight:normal}
.search-input:focus{border-color:#16a34a}
.card{background:#fff;padding:0;border:none}
.btn-primary{padding:6px 12px;background:#16a34a;color:#fff;border:none;border-radius:4px;font-size:0.85rem;cursor:pointer;display:flex;align-items:center;gap:4px;white-space:nowrap;font-weight:normal}
.btn-primary:hover{background:#15803d}
.btn-secondary-toggle{padding:6px 12px;background:#f1f5f9;color:#334155;border:1px solid #cbd5e1;border-radius:4px;font-size:0.85rem;cursor:pointer;display:flex;align-items:center;gap:4px;white-space:nowrap;font-weight:normal}
.btn-secondary-toggle:hover{background:#e2e8f0;color:#0f172a}
.table-container{max-height:calc(100vh - 180px);overflow-y:auto;border:1px solid #cbd5e1;border-radius:4px}
.irac-table{width:100%;border-collapse:collapse;font-size:0.85rem;text-align:left;background:#fff}
.irac-table th{position:sticky;top:0;background:#f1f5f9;color:#000;font-weight:700;padding:8px 12px;border-bottom:2px solid #cbd5e1;border-right:1px solid #e2e8f0;z-index:10}
.irac-table td{padding:8px 12px;border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;color:#000;vertical-align:top;font-weight:normal}
.irac-table tr:hover td{background:#f8fafc}
.group-bottom-border td{border-bottom:2px solid #94a3b8!important}
.group-cell{background:#f8fafc;color:#000;vertical-align:top;font-weight:700}
.action-cell{background:#f8fafc;color:#000;vertical-align:top;font-weight:normal}
.subgroup-cell{display:flex;align-items:center;gap:8px}
.subgroup-code,.subgroup-name{color:#000;font-weight:normal}
.subgroup-code{min-width:24px}
.column-content{display:flex;flex-direction:column;gap:8px}
.brand-tags{display:flex;flex-wrap:wrap;gap:6px}

/* Hover Tooltip Dropping Downwards */
.brand-tag-wrapper{position:relative;display:inline-block;z-index:1}
.brand-hover-tooltip{visibility:hidden;opacity:0;position:absolute;top:100%;left:0;transform:translateY(4px);background:#0f172a;color:#fff;padding:8px 12px;border-radius:6px;font-size:0.75rem;width:220px;z-index:100;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -1px rgba(0,0,0,0.06);transition:all 0.2s ease;pointer-events:none;font-weight:normal}
.brand-tag-wrapper:hover{z-index:50}
.brand-tag-wrapper:hover .brand-hover-tooltip{visibility:visible;opacity:1}
.tooltip-row{display:flex;align-items:center;gap:6px;margin-bottom:4px}
.tooltip-row:last-child{margin-bottom:0}
.tooltip-label{color:#94a3b8;font-weight:600;min-width:45px}
.tooltip-pests-list{display:flex;flex-wrap:wrap;gap:3px}
.pest-chip{background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:1px 5px;border-radius:3px;font-size:0.7rem}

.brand-tag{background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;padding:3px 8px;border-radius:4px;font-size:0.78rem;display:inline-flex;align-items:center;gap:6px;font-weight:normal}
.brand-name{color:#0f172a;font-weight:700}
.brand-ai{color:#15803d;font-weight:normal}
.type-badge{font-size:0.65rem;padding:1px 5px;border-radius:3px;text-transform:uppercase;letter-spacing:0.02em;font-weight:normal}
.badge-systemic{background:#dbeafe;color:#1e40af;border:1px solid #bfdbfe}
.badge-contact{background:#fef3c7;color:#92400e;border:1px solid #fde68a}
.badge-translaminar{background:#f3e8ff;color:#6b21a8;border:1px solid #e9d5ff}
.badge-systrans{background:#ccfbf1;color:#115e59;border:1px solid #99f6e4}
.badge-dual{background:#e0e7ff;color:#3730a3;border:1px solid #c7d2fe}
.empty-brand-slot{font-size:0.75rem;color:#94a3b8;font-style:italic;font-weight:normal}
.ai-reference-section{display:flex;flex-direction:column;gap:4px;padding-top:6px;border-top:1px dashed #cbd5e1}
.ai-chips{display:flex;flex-wrap:wrap;gap:3px}
.ai-chip{background:#f8fafc;border:1px solid #e2e8f0;color:#334155;padding:1px 5px;border-radius:3px;font-size:0.7rem;font-weight:normal}
.no-results{text-align:center;color:#000;padding:24px 0;font-weight:normal}
.brand-tag.clickable-tag{cursor:pointer;transition:all 0.2s ease}
.brand-tag.clickable-tag:hover{background:#dcfce7;border-color:#86efac}
</style>