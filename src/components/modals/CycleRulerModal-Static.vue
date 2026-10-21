<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="close">
    <div class="modal-card ruler-modal">
      <div class="modal-header">
        <div class="header-title-group">
          <h3>Crop Stages & Spray Interval Simulator</h3>
          <p class="header-description">
            Crop: <b>{{ crop?.crop_name }}</b> ({{ crop?.variety }}) • Total Cycle: <b>{{ maxDays }} Days</b> (Trigger: {{ crop?.trigger_type || 'DAF' }})
          </p>
        </div>
        <button @click="close" class="btn-close" title="Close">✕</button>
      </div>

      <div class="modal-body">
        <!-- CARD 1: Crop Phenology Stages Ruler (3-Line Layout) -->
        <div class="ruler-card-section taller-card">
          <div class="section-card-header">
            <h4>Crop Stages</h4>
          </div>
          <div class="ruler-container">
            <div class="details-track-area stages-details">
              <div 
                v-for="stage in mockStages" 
                :key="stage.id" 
                class="stage-block"
                :style="{ 
                  left: `${(stage.start / maxDays) * 100}%`, 
                  width: `${((stage.end - stage.start) / maxDays) * 100}%` 
                }"
              >
                <!-- Line 1: Stage Name -->
                <span class="block-label">{{ stage.name }}</span>
                <!-- Line 2: Day Start & Day End -->
                <span class="day-range-badge">Day {{ stage.start }} – {{ stage.end }}</span>
                <!-- Line 3: Target Pests -->
                <div class="pest-chips-container">
                  <span v-for="(pest, idx) in stage.target_pests" :key="idx" class="pest-chip">{{ pest }}</span>
                </div>
              </div>
            </div>

            <!-- Main Ruler Track -->
            <div class="ruler-track-line" @click="handleCropRulerClick">
              <div 
                v-for="tick in rulerTicks" 
                :key="'crop-' + tick" 
                :class="[
                  'ruler-tick', 
                  tick % 10 === 0 ? 'tick-ten' : tick % 5 === 0 ? 'tick-five' : 'tick-one'
                ]"
                :style="{ left: `${(tick / maxDays) * 100}%` }"
              >
                <span class="tick-label" v-if="tick % 10 === 0">Day {{ tick }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- CARD 2: Spray Interval Passes Ruler (3-Line Layout: Insecticides/Fungicides, Adjuvant, Others) -->
        <div class="ruler-card-section taller-card">
          <div class="section-card-header">
            <h4>Spray Interval</h4>
          </div>
          <div class="ruler-container">
            <div class="details-track-area sprays-details">
              <div 
                v-for="spray in mockSprays" 
                :key="spray.id" 
                class="spray-marker-pin"
                :style="{ left: `${(spray.day / maxDays) * 100}%` }"
              >
                <div class="pin-badge-group">
                  <!-- Line 1: Insecticides / Fungicides -->
                  <span class="pin-chemical">{{ spray.chemical }} (Day {{ spray.day }})</span>
                  <!-- Line 2: Adjuvant -->
                  <span class="pin-adjuvant">Adjuvant: {{ spray.adjuvant }}</span>
                  <!-- Line 3: Others / Target & Dosage -->
                  <span class="pin-others">{{ spray.others }} | ₱{{ spray.cost }}</span>
                </div>
                <div class="pin-line"></div>
              </div>
            </div>

            <!-- Main Ruler Track -->
            <div class="ruler-track-line" @click="handleSprayRulerClick">
              <div 
                v-for="tick in rulerTicks" 
                :key="'spray-' + tick" 
                :class="[
                  'ruler-tick', 
                  tick % 10 === 0 ? 'tick-ten' : tick % 5 === 0 ? 'tick-five' : 'tick-one'
                ]"
                :style="{ left: `${(tick / maxDays) * 100}%` }"
              >
                <span class="tick-label" v-if="tick % 10 === 0">Day {{ tick }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  isOpen: Boolean,
  crop: {
    type: Object,
    default: () => ({ crop_name: 'Durian', variety: 'Puyat', expected_cycle_duration_days: 120, trigger_type: 'DAF' })
  }
});

const emit = defineEmits(['close']);

const maxDays = computed(() => props.crop?.expected_cycle_duration_days || 120);

const rulerTicks = computed(() => {
  const ticks = [];
  for (let i = 0; i <= maxDays.value; i++) {
    ticks.push(i);
  }
  return ticks;
});

const mockStages = computed(() => [
  { id: 1, name: 'Flower Induction', start: 0, end: 20, target_pests: ['Thrips', 'Aphids'] },
  { id: 2, name: 'Bloom & Pollination', start: 20, end: 45, target_pests: ['Fruit Borer'] },
  { id: 3, name: 'Fruit Development', start: 45, end: 90, target_pests: ['Rind Borer', 'Fungal Blight'] },
  { id: 4, name: 'Maturation & Harvest', start: 90, end: maxDays.value, target_pests: ['Fruit Rot'] }
]);

const mockSprays = computed(() => [
  { id: 1, day: 12, chemical: 'Copper Hydroxide (Fungicide)', adjuvant: 'Non-ionic Surfactant', others: '40g/tree', cost: 1200 },
  { id: 2, day: 35, chemical: 'Cypermethrin (Insecticide)', adjuvant: 'Spread Sticker', others: '30ml/tree', cost: 1800 },
  { id: 3, day: 60, chemical: 'Potassium Nitrate (Foliar)', adjuvant: 'Silicone Adjuvant', others: '60ml/tree', cost: 2500 },
  { id: 4, day: 85, chemical: 'Systemic Fungicide', adjuvant: 'Bio-Adjuvant', others: '50ml/tree', cost: 2100 }
]);

function handleCropRulerClick(event) {
  const rect = event.currentTarget.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const percentage = Math.max(0, Math.min(1, clickX / rect.width));
  const calculatedDay = Math.round(percentage * maxDays.value);
  
  alert(`Crop Stage Timeline: Day ${calculatedDay} of ${maxDays.value}`);
}

function handleSprayRulerClick(event) {
  const rect = event.currentTarget.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const percentage = Math.max(0, Math.min(1, clickX / rect.width));
  const calculatedDay = Math.round(percentage * maxDays.value);
  
  alert(`Spray Interval Timeline: Day ${calculatedDay} of ${maxDays.value}`);
}

function close() {
  emit('close');
}
</script>

<style scoped>
.modal-backdrop{position:fixed;inset:0;background:rgba(15,23,42,0.4);backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;z-index:60;padding:20px}
.modal-card.ruler-modal{background:#fff;border-radius:12px;width:100%;max-width:100%;height:80vh;padding:24px;box-shadow:0 20px 40px -10px rgba(0,0,0,0.15);display:flex;flex-direction:column;gap:16px;text-align:left;box-sizing:border-box;overflow:hidden}

.modal-header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:12px;border-bottom:1px solid #f1f5f9;flex-shrink:0}
.header-title-group{display:flex;flex-direction:column;gap:2px}
.modal-header h3{margin:0;font-size:1.15rem;color:#0f172a;font-weight:700}
.header-description{margin:2px 0 0 0;font-size:0.78rem;color:#64748b}
.btn-close{background:none;border:none;font-size:1rem;color:#64748b;cursor:pointer;padding:4px}
.btn-close:hover{color:#0f172a}

.modal-body{display:flex;flex-direction:column;gap:16px;flex:1;overflow-y:auto;padding-right:4px}

.ruler-card-section.taller-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;display:flex;flex-direction:column;gap:12px;flex:1;min-height:220px}
.section-card-header h4{margin:0;font-size:0.85rem;color:#0f172a;font-weight:700}

.ruler-container{position:relative;padding:85px 12px 45px 12px;background:#fff;border-radius:8px;border:1px solid #f1f5f9;margin-top:auto}
.ruler-track-line{position:relative;height:4px;background:#cbd5e1;border-radius:2px;cursor:pointer;margin:0 10px}

.details-track-area{position:absolute;left:22px;right:22px;height:65px;top:10px}

/* 3-Line Stage Block Layout */
.stage-block{position:absolute;height:62px;background:#ecfdf5;border:1px solid #a7f3d0;color:#047857;border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4px 6px;box-sizing:border-box;gap:2px;overflow:hidden}
.block-label{font-size:0.7rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.day-range-badge{background:#dcfce7;color:#166534;font-size:0.56rem;font-weight:700;padding:1px 4px;border-radius:3px;white-space:nowrap}
.pest-chips-container{display:flex;gap:3px;flex-wrap:wrap;justify-content:center}
.pest-chip{background:#f1f5f9;color:#334155;font-size:0.58rem;font-weight:600;padding:1px 4px;border-radius:3px;white-space:nowrap}

/* 3-Line Spray Pin Layout (Insecticides/Fungicides, Adjuvant, Others) */
.spray-marker-pin{position:absolute;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center}
.pin-badge-group{background:#0f172a;color:#fff;font-size:0.62rem;padding:5px 8px;border-radius:6px;display:flex;flex-direction:column;align-items:center;gap:2px;white-space:nowrap;box-shadow:0 2px 4px rgba(0,0,0,0.15)}
.pin-chemical{font-weight:700;color:#f8fafc}
.pin-adjuvant{color:#cbd5e1;font-size:0.58rem}
.pin-others{color:#4ade80;font-size:0.58rem;font-weight:600}
.pin-line{width:1px;height:18px;background:#0f172a;margin-top:2px}

.ruler-tick{position:absolute;top:8px;transform:translateX(-50%);width:1px;background:#94a3b8}

.tick-ten{height:16px;background:#475569;width:2px;z-index:2}
.tick-ten .tick-label{position:absolute;top:22px;left:50%;transform:translateX(-50%);font-size:0.65rem;color:#475569;white-space:nowrap;font-weight:700}

.tick-five{height:10px;background:#94a3b8;width:1.5px;z-index:1}
.tick-one{height:6px;background:#cbd5e1;width:1px;z-index:0}
</style>