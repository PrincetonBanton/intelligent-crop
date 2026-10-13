<template>
  <div class="ipm-view">
    <!-- View Header -->
    <div class="view-header">
      <div>
        <h2>IRAC Insecticide Resistance Management</h2>
      </div>
      <div class="header-actions">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Filter Group, MoA, or Sub-group..." 
          class="search-input"
        />
        <!-- Toggle Button for Active Ingredients Reference (Moved to Right) -->
        <button @click="showModal = true" class="btn-primary"><span>+</span> Register Chemical</button>
        <button @click="showActiveIngredients = !showActiveIngredients" class="btn-secondary-toggle">
          {{ showActiveIngredients ? 'Hide AI' : 'Show AI' }}
        </button>
      </div>
    </div>

    <!-- IRAC Master Table Card -->
    <div class="card list-card">
      <div class="table-container">
        <table class="irac-table">
          <thead>
            <tr>
              <th style="width: 8%;">Group</th>
              <th style="width: 25%;">Mode of Action</th>
              <th style="width: 22%;">Subgroup Class</th>
              <th style="width: 45%;">Brand Name and AI</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="4" class="no-results">Loading IRAC master data...</td>
            </tr>

            <template v-else v-for="groupObj in groupedIracData" :key="groupObj.group">
              <template v-for="(sub, subIndex) in groupObj.subGroups" :key="sub.subGroup">
                <tr :class="{ 'group-bottom-border': subIndex === groupObj.subGroups.length - 1 }">
                  <!-- Row-span Group and Action cells -->
                  <td v-if="subIndex === 0" :rowspan="groupObj.subGroups.length" class="group-cell">
                    <strong>{{ groupObj.group }}</strong>
                  </td>
                  <td v-if="subIndex === 0" :rowspan="groupObj.subGroups.length" class="action-cell">
                    <strong>{{ groupObj.actionType }}</strong>
                  </td>

                  <!-- Subgroup Class -->
                  <td>
                    <div class="subgroup-cell">
                      <span class="subgroup-code">{{ sub.subGroup }}</span>
                      <span class="subgroup-name">{{ sub.chemicalClass }}</span>
                    </div>
                  </td>

                  <!-- Brand Name and AI -->
                  <td>
                    <div class="column-content">
                      <!-- Registered Commercial Brands -->
                      <div class="brands-section">
                        <span class="section-label">Registered Brands:</span>
                        <div v-if="getMappedBrands(sub.subGroup).length > 0" class="brand-tags">
                          <span 
                            v-for="brand in getMappedBrands(sub.subGroup)" 
                            :key="brand.id" 
                            class="brand-tag"
                          >
                            {{ brand.trade_name }} <small>({{ brand.active_ingredient }})</small>
                          </span>
                        </div>
                        <span v-else class="empty-brand-slot">No commercial brands encoded yet</span>
                      </div>

                      <!-- Official IRAC Active Ingredients Reference (Toggled) -->
                      <div v-if="showActiveIngredients" class="ai-reference-section">
                        <span class="section-label ai-label">Official IRAC Active Ingredients:</span>
                        <div class="ai-chips">
                          <span 
                            v-for="(ai, idx) in sub.activeIngredients" 
                            :key="idx" 
                            class="ai-chip"
                          >
                            {{ ai }}
                          </span>
                          <span v-if="!sub.activeIngredients || sub.activeIngredients.length === 0" class="empty-brand-slot">
                            None listed
                          </span>
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

    <!-- Registration Modal -->
    <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Register Chemical Input</h3>
          <button @click="showModal = false" class="btn-close">✕</button>
        </div>
        <p class="modal-desc">
          Select an active ingredient to automatically map your commercial trade product to its official IRAC Group.
        </p>
        <div class="modal-actions">
          <button @click="showModal = false" class="btn-secondary">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { supabase } from '../providers/supabaseProvider.js';

const searchQuery = ref('');
const showModal = ref(false);
const showActiveIngredients = ref(false); // Toggle state
const loading = ref(true);
const iracMasterData = ref([]);
const registeredChemicals = ref([]);

async function fetchData() {
  loading.value = true;
  try {
    const [iracRes, chemRes] = await Promise.all([
      supabase.from('irac_master').select('*').order('irac_group', { ascending: true }),
      supabase.from('ipm_inputs').select('*')
    ]);

    if (iracRes.error) throw iracRes.error;
    iracMasterData.value = iracRes.data || [];

    if (!chemRes.error) {
      registeredChemicals.value = chemRes.data || [];
    }
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
    const brands = getMappedBrands(item.sub_group).map(b => b.trade_name + ' ' + b.active_ingredient).join(' ').toLowerCase();
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
      groupMap.set(groupKey, {
        group: item.irac_group,
        actionType: item.action_type,
        subGroups: []
      });
    }
    const existing = groupMap.get(groupKey).subGroups;
    if (!existing.some(s => s.subGroup === item.sub_group)) {
      existing.push({
        subGroup: item.sub_group,
        chemicalClass: item.chemical_class,
        activeIngredients: item.active_ingredients || []
      });
    }
  });

  // Convert map to array and sort numerically by group
  return Array.from(groupMap.values()).sort((a, b) => {
    const getNum = (val) => {
      const cleaned = val.replace(/[^0-9]/g, '');
      return cleaned ? parseInt(cleaned, 10) : 999;
    };

    const numA = getNum(a.group);
    const numB = getNum(b.group);

    if (numA !== numB) {
      return numA - numB;
    }
    return a.group.localeCompare(b.group);
  });
});

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.ipm-view { display: flex; flex-direction: column; gap: 16px; text-align: left; background: #fff; margin: 0; padding: 0; width: 100%; box-sizing: border-box; }
.view-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; gap: 16px; flex-wrap: wrap; }
.view-header h2 { margin: 0; font-size: 1.25rem; font-weight: 700; color: #000000; }
.header-actions { display: flex; align-items: center; gap: 10px; }
.search-input { padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.85rem; width: 220px; outline: none; color: #000000; }
.search-input:focus { border-color: #16a34a; }

.card { background: #fff; padding: 0; border: none; }
.btn-primary { padding: 6px 12px; background: #16a34a; color: #fff; border: none; border-radius: 4px; font-weight: 600; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 4px; white-space: nowrap; }
.btn-primary:hover { background: #15803d; }

.btn-secondary-toggle { padding: 6px 12px; background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; border-radius: 4px; font-weight: 600; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 4px; white-space: nowrap; }
.btn-secondary-toggle:hover { background: #e2e8f0; color: #0f172a; }

.table-container { max-height: calc(100vh - 180px); overflow-y: auto; border: 1px solid #cbd5e1; border-radius: 4px; }
.irac-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left; background: #fff; }
.irac-table th { position: sticky; top: 0; background: #f1f5f9; color: #000000; font-weight: 700; padding: 8px 12px; border-bottom: 2px solid #cbd5e1; border-right: 1px solid #e2e8f0; z-index: 10; }

.irac-table td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; color: #000000; vertical-align: top; }
.irac-table tr:hover td { background: #f8fafc; }

.group-bottom-border td { border-bottom: 2px solid #94a3b8 !important; }

.group-cell { text-align: center; background: #f8fafc; font-weight: 800; color: #000000; vertical-align: top; }
.action-cell { background: #f8fafc; color: #000000; vertical-align: top; }

.subgroup-cell { display: flex; align-items: center; gap: 8px; }
.subgroup-code { font-weight: 800; color: #000000; min-width: 24px; }
.subgroup-name { color: #000000; font-weight: 500; }

.column-content { display: flex; flex-direction: column; gap: 8px; }
.brands-section { display: flex; flex-direction: column; gap: 4px; }
.section-label { font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.03em; }

.brand-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.brand-tag { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 2px 6px; border-radius: 3px; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; }
.brand-tag small { color: #15803d; font-weight: 500; }
.empty-brand-slot { font-size: 0.75rem; color: #94a3b8; font-style: italic; }

.ai-reference-section { display: flex; flex-direction: column; gap: 4px; padding-top: 6px; border-top: 1px dashed #cbd5e1; }
.ai-label { color: #475569; }
.ai-chips { display: flex; flex-wrap: wrap; gap: 3px; }
.ai-chip { background: #f8fafc; border: 1px solid #e2e8f0; color: #334155; padding: 1px 5px; border-radius: 3px; font-size: 0.7rem; }

.no-results { text-align: center; color: #000000; padding: 24px 0; }

/* Modal Styles */
.modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,0.5); display: flex; align-items: center; justify-content: center; z-index: 50; }
.modal-card { background: #fff; border-radius: 6px; width: 100%; max-width: 440px; padding: 20px; border: 1px solid #cbd5e1; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.08); color: #000000; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.modal-header h3 { margin: 0; font-size: 1.1rem; color: #000000; font-weight: 700; }
.modal-desc { font-size: 0.85rem; color: #000000; opacity: 0.8; margin-bottom: 16px; }
.btn-close { background: none; border: none; font-size: 1rem; color: #000000; cursor: pointer; padding: 4px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px; }
.btn-secondary { padding: 6px 12px; border-radius: 4px; font-weight: 600; font-size: 0.85rem; cursor: pointer; border: 1px solid #cbd5e1; background: #f1f5f9; color: #000000; }
.btn-secondary:hover { background: #e2e8f0; }
</style>