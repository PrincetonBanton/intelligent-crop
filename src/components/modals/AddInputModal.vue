<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="closeModal">
    <div class="modal-card">
      <div class="modal-header">
        <h3>Register Chemical Input</h3>
        <button @click="closeModal" class="btn-close">✕</button>
      </div>
      <p class="modal-desc">
        Type a commercial trade name and select its official active ingredient to automatically inherit its IRAC classification.
      </p>

      <form @submit.prevent="handleSubmit" class="modal-form">
        <!-- Trade Name -->
        <div class="form-group">
          <label>Commercial Trade Name</label>
          <input 
            v-model="form.tradeName" 
            type="text" 
            placeholder="e.g. Prevathon, Karate, Penant..." 
            required
            class="form-input"
          />
        </div>

        <!-- Category (Default to Insecticide) -->
        <div class="form-group">
          <label>Category</label>
          <input 
            v-model="form.category" 
            type="text" 
            required
            class="form-input"
          />
        </div>

        <!-- Active Ingredient Search / Autocomplete -->
        <div class="form-group autocomplete-container">
          <label>Active Ingredient (AI)</label>
          <input 
            v-model="aiSearchQuery" 
            @focus="showDropdown = true"
            type="text" 
            placeholder="Type to search official active ingredient..." 
            class="form-input"
          />
          
          <!-- Dropdown Results -->
          <div v-if="showDropdown && filteredAiList.length > 0" class="autocomplete-dropdown">
            <div 
              v-for="(match, idx) in filteredAiList" 
              :key="idx"
              @click="selectActiveIngredient(match)"
              class="autocomplete-item"
            >
              <span class="matched-ai"><strong>{{ match.ai }}</strong></span>
              <span class="match-meta">Group {{ match.item.irac_group }} ({{ match.item.sub_group }} - {{ match.item.chemical_class }})</span>
            </div>
          </div>
        </div>

        <!-- Auto-Populated IRAC Taxonomy Card -->
        <div v-if="form.selectedItem" class="taxonomy-preview-card">
          <div class="preview-title">Inherited IRAC Taxonomy</div>
          <div class="preview-grid">
            <div><strong>Group:</strong> {{ form.selectedItem.irac_group }}</div>
            <div><strong>Sub-group:</strong> {{ form.selectedItem.sub_group }}</div>
            <div><strong>Class:</strong> {{ form.selectedItem.chemical_class }}</div>
            <div class="full-width"><strong>Mode of Action:</strong> {{ form.selectedItem.action_type }}</div>
          </div>
        </div>

        <!-- Error / Success Feedback -->
        <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>

        <!-- Actions -->
        <div class="modal-actions">
          <button type="button" @click="closeModal" class="btn-secondary">Cancel</button>
          <button type="submit" :disabled="submitting || !form.selectedItem" class="btn-primary">
            {{ submitting ? 'Saving...' : 'Save Registration' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { supabase } from '../../providers/supabaseProvider.js';

const props = defineProps({
  isOpen: { type: Boolean, required: true }
});

const emit = defineEmits(['close', 'saved']);

const iracMasterData = ref([]);
const aiSearchQuery = ref('');
const showDropdown = ref(false);
const submitting = ref(false);
const errorMessage = ref('');

const form = ref({
  tradeName: '',
  category: 'Insecticide', // Default category set to Insecticide
  activeIngredient: '',
  subGroup: '',
  selectedItem: null
});

// Fetch all IRAC master rows on mount
async function fetchIracMaster() {
  try {
    const { data, error } = await supabase.from('irac_master').select('*');
    if (error) throw error;
    iracMasterData.value = data || [];
  } catch (err) {
    console.error('Error fetching IRAC master for modal:', err.message);
  }
}

// Flatten active ingredients across records for smart autocomplete
const filteredAiList = computed(() => {
  const q = aiSearchQuery.value.trim().toLowerCase();
  if (!q) return [];

  const results = [];
  iracMasterData.value.forEach(item => {
    if (item.active_ingredients && Array.isArray(item.active_ingredients)) {
      item.active_ingredients.forEach(ai => {
        if (ai.toLowerCase().includes(q)) {
          results.push({ ai, item });
        }
      });
    }
  });
  return results.slice(0, 10);
});

function selectActiveIngredient(match) {
  form.value.activeIngredient = match.ai;
  form.value.subGroup = match.item.sub_group;
  form.value.selectedItem = match.item;
  aiSearchQuery.value = match.ai;
  showDropdown.value = false;
}

async function handleSubmit() {
  if (!form.value.selectedItem || !form.value.tradeName.trim()) {
    errorMessage.value = 'Please provide a trade name and select a valid active ingredient.';
    return;
  }

  submitting.value = true;
  errorMessage.value = '';

  try {
    const { error } = await supabase.from('ipm_inputs').insert([
      {
        trade_name: form.value.tradeName.trim(),
        category: form.value.category,
        active_ingredient: form.value.activeIngredient,
        sub_group: form.value.subGroup,
        unit_type: 'ml', // Default unit type or can be added as form input later
        dosage_per_knapsack: 15.00, // Default baseline or form input
        package_price: 1000.00,
        package_size: 1000
      }
    ]);

    if (error) throw error;

    emit('saved');
    closeModal();
  } catch (err) {
    console.error('Failed to save chemical input:', err.message);
    errorMessage.value = 'Failed to save: ' + err.message;
  } finally {
    submitting.value = false;
  }
}

function closeModal() {
  form.value = { tradeName: '', category: 'Insecticide', activeIngredient: '', subGroup: '', selectedItem: null };
  aiSearchQuery.value = '';
  errorMessage.value = '';
  showDropdown.value = false;
  emit('close');
}

onMounted(() => {
  fetchIracMaster();
});
</script>

<style scoped>
.modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,0.5); display: flex; align-items: center; justify-content: center; z-index: 50; }
.modal-card { background: #fff; border-radius: 6px; width: 100%; max-width: 480px; padding: 24px; border: 1px solid #cbd5e1; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); color: #000; text-align: left; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.modal-header h3 { margin: 0; font-size: 1.15rem; font-weight: 700; color: #000; }
.modal-desc { font-size: 0.82rem; color: #475569; margin-bottom: 16px; }

.modal-form { display: flex; flex-direction: column; gap: 14px; }
.form-group { display: flex; flex-direction: column; gap: 4px; position: relative; }
.form-group label { font-size: 0.78rem; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.03em; }
.form-input { padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.85rem; outline: none; color: #000; width: 100%; box-sizing: border-box; background: #fff; }
.form-input:focus { border-color: #16a34a; }

/* Autocomplete Dropdown */
.autocomplete-container { position: relative; }
.autocomplete-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: #fff; border: 1px solid #cbd5e1; border-radius: 4px; max-height: 180px; overflow-y: auto; z-index: 20; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); margin-top: 2px; }
.autocomplete-item { padding: 8px 10px; font-size: 0.8rem; cursor: pointer; display: flex; flex-direction: column; border-bottom: 1px solid #f1f5f9; }
.autocomplete-item:hover { background: #f0fdf4; }
.matched-ai { color: #0f172a; }
.match-meta { font-size: 0.72rem; color: #64748b; }

/* Taxonomy Preview Card */
.taxonomy-preview-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; }
.preview-title { font-size: 0.72rem; font-weight: 700; color: #475569; text-transform: uppercase; }
.preview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 0.78rem; color: #334155; }
.full-width { grid-column: span 2; }

.error-msg { font-size: 0.78rem; color: #dc2626; margin: 0; font-weight: 600; }

.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
.btn-secondary { padding: 6px 12px; border-radius: 4px; font-weight: 600; font-size: 0.85rem; cursor: pointer; border: 1px solid #cbd5e1; background: #f1f5f9; color: #334155; }
.btn-secondary:hover { background: #e2e8f0; }
.btn-primary { padding: 6px 14px; background: #16a34a; color: #fff; border: none; border-radius: 4px; font-weight: 600; font-size: 0.85rem; cursor: pointer; }
.btn-primary:hover { background: #15803d; }
.btn-primary:disabled { background: #94a3b8; cursor: not-allowed; }
.btn-close { background: none; border: none; font-size: 1rem; color: #64748b; cursor: pointer; padding: 4px; }
.btn-close:hover { color: #000; }
</style>