<template>
  <div class="auth-card">
    <h3>{{ isSignUp ? 'Create Account' : 'Sign In' }}</h3>
    <form @submit.prevent="handleAuth">
      <div class="form-group">
        <label>Emailddffd Address</label>
        <input v-model="email" type="email" placeholder="manager@intelligentcrop.com" required />
      </div>
      <div class="form-group">
        <label>Passwordsdsdsds</label>
        <input v-model="password" type="password" placeholder="••••••••" required />
      </div>
      <button type="submit" :disabled="loading" class="btn-primary">
        {{ loading ? 'Authenticating...' : (isSignUp ? 'Sign Up' : 'Sign In') }}
      </button>
    </form>

    <button type="button" @click="handleTestBypass" class="btn-secondary">
      View Test
    </button>

    <p class="toggle-text">
      {{ isSignUp ? 'Already registered?' : 'Need an account?' }}
      <a @click="isSignUp = !isSignUp">{{ isSignUp ? 'Sign In' : 'Sign Up' }}</a>
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { authService } from '../services/authService.js';

const emit = defineEmits(['authenticated']);
const email = ref('');
const password = ref('');
const isSignUp = ref(false);
const loading = ref(false);

async function handleAuth() {
  loading.value = true;
  try {
    let res;
    if (isSignUp.value) {
      await authService.signUp(email.value, password.value);
      alert('Account created! Please sign in.');
      isSignUp.value = false;
    } else {
      res = await authService.signIn(email.value, password.value);
      if (res?.user) emit('authenticated', res.user);
    }
  } catch (err) {
    alert('Auth Error: ' + err.message);
  } finally {
    loading.value = false;
  }
}

function handleTestBypass() {
  const testUser = { email: 'simulator@test.com', role: 'owner' };
  emit('authenticated', testUser);
}
</script>

<style scoped>
.auth-card{width:340px;padding:28px;background:#fff;border-radius:8px;border:1px solid #cbd5e1;display:flex;flex-direction:column;gap:16px;margin:auto;box-sizing:border-box}
.auth-card h3{margin:0;font-size:1.2rem;color:#0f172a}
.form-group{display:flex;flex-direction:column;gap:4px;width:100%}
.form-group label{font-size:0.8rem;font-weight:600;color:#475569}
.form-group input{width:100%;padding:8px 12px;border:1px solid #cbd5e1;border-radius:6px;font-size:0.875rem;box-sizing:border-box;outline:none}
.form-group input:focus{border-color:#16a34a}
.btn-primary{width:100%;padding:10px;background:#16a34a;color:#fff;border:none;border-radius:6px;font-weight:600;cursor:pointer;margin-top:8px;box-sizing:border-box}
.btn-primary:hover{background:#15803d}
.btn-secondary{width:100%;padding:9px;background:#f8fafc;color:#334155;border:1px solid #cbd5e1;border-radius:6px;font-weight:600;cursor:pointer;box-sizing:border-box;font-size:0.85rem}
.btn-secondary:hover{background:#f1f5f9;border-color:#94a3b8}
.toggle-text{font-size:0.8rem;color:#64748b;margin:0;text-align:center}
.toggle-text a{color:#16a34a;font-weight:600;cursor:pointer;text-decoration:underline}
</style>