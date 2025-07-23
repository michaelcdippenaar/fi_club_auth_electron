<template>
  <q-page class="q-pa-md">
    <q-form @submit="login">
      <q-input v-model="form.username" label="Username" filled />
      <q-input v-model="form.password" label="Password" type="password" filled />
      <q-btn type="submit" color="primary" label="Login" />
    </q-form>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { api } from 'src/boot/axios';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const form = ref({ username: '', password: '' });
const router = useRouter();

async function login() {
  try {
    const response = await api.post('/login/', form.value);
    localStorage.setItem('token', response.data.token);
    $q.notify({ type: 'positive', message: 'Login successful!' });
    router.push('/enroll');
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Login failed: ' + error.message });
  }
}
</script>
