<template>
  <div class="crop-setup-view">
    <div class="view-header">
      <h2>Crop Setup</h2>
      <span class="sub-subtitle">Manage crop life cycles, phenological stages, and scheduled chemical application windows.</span>
    </div>

    <!-- Day 0 Control Bar -->
    <div class="card control-card">
      <div class="date-picker-group">
        <label for="dayZeroDate">Day 0 (Flower Induction Date):</label>
        <input 
          id="dayZeroDate"
          type="date" 
          v-model="dayZeroDate" 
          class="form-input-date"
        />
      </div>
    </div>

    <div class="card content-card">
      <div class="timeline-container">
        <!-- Horizontal Timeline Axis -->
        <div class="timeline-axis-line"></div>

        <div class="stages-timeline-grid">
          <div 
            v-for="(stage, index) in calculatedStages" 
            :key="index" 
            class="timeline-stage-node"
          >
            <!-- Chemical Slots positioned above node marker -->
            <div class="chemical-slots-group">
              <div v-for="slot in 3" :key="slot" class="chem-slot-placeholder">
                <span class="slot-text">Input Slot {{ slot }}</span>
              </div>
            </div>

            <!-- Timeline Node Marker with Gaps Above and Below -->
            <div class="node-marker-wrap">
              <div class="timeline-dot"></div>
            </div>

            <!-- Stage Info Box Uniformly Below Line -->
            <div class="stage-info-box">
              <strong class="stage-name">{{ stage.name }}</strong>
              <span class="stage-dafi">{{ stage.dafi }}</span>
              <span class="stage-calculated-date">{{ stage.computedDateText }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// Default Day 0 set to today (YYYY-MM-DD)
const dayZeroDate = ref(new Date().toISOString().split('T')[0]);

const sampleCropStages = [
  { name: 'Flower Induction', dafi: '0 DAFI' },
  { name: 'Bud Emergence', dafi: '10-14 DAFI' },
  { name: 'Bud Elongation', dafi: '15-18 DAFI' },
  { name: 'Pre-Bloom', dafi: '21-28 DAFI' },
  { name: 'Full Bloom', dafi: '26-33 DAFI' },
  { name: 'Fruit Set', dafi: '32-35 DAFI' },
  { name: 'Fruit Set (Late)', dafi: '42-45 DAFI' },
  { name: 'Fruit Development', dafi: '52-55 DAFI' },
  { name: 'Fruit Development II', dafi: '56-65 DAFI' },
  { name: 'Fruit Enlargement', dafi: '70-75 DAFI' },
  { name: 'Fruit Maturity', dafi: '80-85 DAFI' },
  { name: 'Fruit Maturity (Final)', dafi: '90-105 DAFI' }
];

// Helper function to format Date object into "MMM DD, YYYY"
function formatDate(dateObj) {
  return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Compute projected dates based on Day 0 + DAFI range/value
const calculatedStages = computed(() => {
  if (!dayZeroDate.value) {
    return sampleCropStages.map(s => ({ ...s, computedDateText: '--' }));
  }

  const baseDate = new Date(dayZeroDate.value);

  return sampleCropStages.map(stage => {
    const numbers = stage.dafi.match(/\d+/g);
    let dateStr = '--';

    if (numbers && numbers.length === 1) {
      const days = parseInt(numbers[0], 10);
      const targetDate = new Date(baseDate);
      targetDate.setDate(targetDate.getDate() + days);
      dateStr = formatDate(targetDate);
    } else if (numbers && numbers.length >= 2) {
      const startDays = parseInt(numbers[0], 10);
      const endDays = parseInt(numbers[1], 10);

      const startDate = new Date(baseDate);
      startDate.setDate(startDate.getDate() + startDays);

      const endDate = new Date(baseDate);
      endDate.setDate(endDate.getDate() + endDays);

      if (startDate.getFullYear() === endDate.getFullYear()) {
        const startFormatted = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endFormatted = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        dateStr = `${startFormatted} - ${endFormatted}`;
      } else {
        dateStr = `${formatDate(startDate)} - ${formatDate(endDate)}`;
      }
    }

    return {
      ...stage,
      computedDateText: dateStr
    };
  });
});
</script>

<style scoped>
.crop-setup-view { display: flex; flex-direction: column; gap: 16px; text-align: left; background: #fff; margin: 0; padding: 0; box-sizing: border-box; }
.view-header { display: flex; flex-direction: column; gap: 4px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; margin: 0; background: #fff; }
.view-header h2 { margin: 0; font-size: 1.25rem; font-weight: 700; color: #0f172a; }
.sub-subtitle { font-size: 0.825rem; color: #64748b; }

.card { background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; }
.control-card { padding: 12px 16px; display: flex; align-items: center; justify-content: flex-start; }

.date-picker-group { display: flex; align-items: center; gap: 12px; }
.date-picker-group label { font-size: 0.85rem; font-weight: 600; color: #334155; }
.form-input-date { padding: 6px 12px; border: none; background: #f8fafc; border-radius: 6px; font-size: 0.85rem; color: #0f172a; outline: none; cursor: pointer; }
.form-input-date:focus { background: #f1f5f9; }

.content-card { padding: 24px; overflow-x: auto; }

/* Timeline Wrapper */
.timeline-container { position: relative; padding: 30px 10px 10px 10px; min-width: 1200px; }
.timeline-axis-line { position: absolute; top: 181px; left: 0; right: 0; height: 3px; background: #16a34a; z-index: 1; }

/* Timeline Stages Grid Layout */
.stages-timeline-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 12px; position: relative; z-index: 2; }
.timeline-stage-node { display: flex; flex-direction: column; align-items: center; position: relative; min-height: 250px; }

/* Chemical Input Slot Boxes */
.chemical-slots-group { display: flex; flex-direction: column; gap: 6px; width: 100%; margin-bottom: 0; }
.chem-slot-placeholder { background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 4px; padding: 6px 4px; text-align: center; height: 26px; display: flex; align-items: center; justify-content: center; transition: all 0.15s ease; }
.chem-slot-placeholder:hover { background: #f1f5f9; border-color: #94a3b8; }
.slot-text { font-size: 0.65rem; color: #64748b; font-weight: 500; white-space: nowrap; }

/* Timeline Marker with Gaps Above and Below Green Axis */
.node-marker-wrap { display: flex; flex-direction: column; align-items: center; position: relative; z-index: 3; height: 12px; margin-top: 18px; margin-bottom: 18px; }
.timeline-dot { width: 12px; height: 12px; background: #16a34a; border: 2px solid #fff; border-radius: 50%; box-shadow: 0 0 0 2px #bbf7d0; }

/* Stage Info Box Uniformly Below Line */
.stage-info-box { display: flex; flex-direction: column; align-items: center; text-align: center; width: 95px; }
.stage-name { font-size: 0.725rem; font-weight: 700; color: #0f172a; line-height: 1.1; margin-bottom: 3px; }
.stage-dafi { font-size: 0.65rem; color: #475569; font-weight: 600; white-space: nowrap; }
.stage-calculated-date { font-size: 0.625rem; color: #16a34a; font-weight: 700; margin-top: 3px; line-height: 1.15; }
</style>