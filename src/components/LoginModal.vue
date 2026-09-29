<template>
  <div class="auth-card">
    <h3>{{ isSignUp ? 'Create Account' : 'Sign In' }}</h3>
    <form @submit.prevent="handleAuth">
      <div class="form-group">
        <label>Email Address</label>
        <input v-model="email" type="email" placeholder="manager@intelligentcrop.com" required />
      </div>
      <div class="form-group">
        <label>Password</label>
        <input v-model="password" type="password" placeholder="••••••••" required />
      </div>
      <button type="submit" :disabled="loading" class="btn-primary">
        {{ loading ? 'Authenticating...' : (isSignUp ? 'Sign Up' : 'Sign In') }}
      </button>
    </form>
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
</script>

<style scoped>
.auth-card { width: 340px; padding: 28px; background: #ffffff; border-radius: 8px; border: 1px solid #cbd5e1; display: flex; flex-direction: column; gap: 16px; margin: auto; }
.auth-card h3 { margin: 0; font-size: 1.2rem; color: #0f172a; }
.form-group { display: flex; flex-direction: column; gap: 4px; }
.form-group label { font-size: 0.8rem; font-weight: 600; color: #475569; }
.form-group input { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.875rem; }
.btn-primary { padding: 10px; background: #16a34a; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; margin-top: 8px; }
.btn-primary:hover { background: #15803d; }
.toggle-text { font-size: 0.8rem; color: #64748b; margin: 0; text-align: center; }
.toggle-text a { color: #16a34a; font-weight: 600; cursor: pointer; text-decoration: underline; }
</style>