<template>
  <div class="crop-setup-view">
    <div class="view-header">
      <h2>Crop Setup</h2>
      <span class="sub-subtitle">Manage crop life cycles, stages, and pest vulnerabilities.</span>
    </div>

    <div class="card content-card">
      <div class="state-msg">
        <p>🌱 Crop Template configuration module ready for development.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
// Future setup logic for crop templates, stages, and pest arrays
</script>

<style scoped>
.crop-setup-view { display: flex; flex-direction: column; gap: 16px; text-align: left; background: #fff; margin: 0; padding: 0; }
.view-header { display: flex; flex-direction: column; gap: 4px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; margin: 0; background: #fff; }
.view-header h2 { margin: 0; font-size: 1.25rem; font-weight: 700; color: #0f172a; }
.sub-subtitle { font-size: 0.825rem; color: #64748b; }
.card { background: #fff; padding: 0; margin: 0; border: none; }
.state-msg { color: #64748b; font-size: 0.85rem; padding: 40px 0; text-align: center; }
</style>