
<template>
  <q-page class="q-pa-md">
    <q-form @submit="register">
      <q-input v-model="form.username" label="Username" filled />
      <q-input v-model="form.email" label="Email" type="email" filled />
      <q-input v-model="form.password" label="Password" type="password" filled />
      <q-btn type="submit" color="primary" label="Register" />
    </q-form>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { api } from 'src/boot/axios';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const form = ref({ username: '', email: '', password: '' });
const router = useRouter();

async function register() {
  try {
    console.log(api)
    const response = await api.post('/register/', form.value);
    localStorage.setItem('token', response.data.token);
    $q.notify({ type: 'positive', message: 'Registration successful!' });
    router.push('/login');
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Registration failed: ' + error.message });
  }
}
</script>
