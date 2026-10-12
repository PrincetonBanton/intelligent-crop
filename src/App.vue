<template>
  <MainHub />
</template>

<script setup>
import { onMounted } from 'vue';
import MainHub from './views/MainHub.vue';
import { supabase } from './providers/supabaseProvider.js';

async function testSupabaseConnection() {
  const currentUrl = import.meta.env.VITE_SUPABASE_URL || 'URL Not Configured';
  
  // Identify active instance reference
  const projectRef = currentUrl.replace('https://', '').split('.')[0];

  try {
    const { data, error } = await supabase.from('farms').select('count', { count: 'exact', head: true });

    if (error) {
      alert(
        `🚨 Active Supabase Target\n\n` +
        `Project Host: ${currentUrl}\n` +
        `Project Ref: ${projectRef}\n\n` +
        `Status: Cache Locked / Schema Error\n` +
        `Error: ${error.message} (Code: ${error.code})`
      );
      return;
    }

    alert(
      `✅ Active Supabase Target\n\n` +
      `Project Host: ${currentUrl}\n` +
      `Project Ref: ${projectRef}\n\n` +
      `Status: Fully Connected & Schema Active!`
    );
  } catch (err) {
    alert(`❌ Connection Error on ${currentUrl}\n\nDetails: ${err.message}`);
  }
}

onMounted(() => {
  testSupabaseConnection();
});
</script>

<style>
body {
  margin: 0;
  background-color: #f8fafc;
}
</style>