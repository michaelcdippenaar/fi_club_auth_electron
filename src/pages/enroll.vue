<template>
  <q-page class="q-pa-md">
    <q-card>
      <q-card-section>
        <div class="text-h6">Certificate Enrollment</div>
      </q-card-section>
      <q-card-section>
        <p v-if="isLoading">Generating and installing configuration profile...</p>
        <p v-if="error" class="text-negative">{{ error }}</p>
        <p v-if="isMacOS && !error">
          The configuration profile is being installed. Please select the profile in System Settings > Privacy & Security > Profiles and click "Install".
        </p>
        <p v-else-if="!isMacOS">
          This application is designed for macOS. Please contact your administrator for other platforms.
        </p>
      </q-card-section>
      <q-card-actions>
        <q-btn
          color="primary"
          label="Install Configuration Profile"
          @click="installProfile"
          :disable="isLoading"
        />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from 'src/boot/axios';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const router = useRouter();
const isLoading = ref(false);
const error = ref(null);
const isElectron = ref(!!window.electronAPI);
const isMacOS = ref(navigator.userAgent.includes('Macintosh'));

// Debug logs
console.log('isElectron:', isElectron.value);
console.log('isMacOS:', isMacOS.value);
console.log('window.electronAPI:', window.electronAPI);

async function installProfile() {
  isLoading.value = true;
  error.value = null;
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      error.value = 'Please log in to install the configuration profile.';
      $q.notify({
        type: 'negative',
        message: error.value,
        timeout: 5000,
      });
      router.push('/login');
      return;
    }

    // Fetch the .mobileconfig file from Django API
    const response = await api.get('/serve-mobileconfig/', {
      headers: { Authorization: `Token ${token}` },
      responseType: 'arraybuffer',
    });
    console.log('API response status:', response.status);
    console.log('API response headers:', response.headers);

    if (isElectron.value && isMacOS.value) {
      console.log('Entering Electron macOS block');
      // Use electronAPI for file operations
      const tempDir = window.electronAPI.os.tmpdir();
      const filePath = window.electronAPI.path.join(
        tempDir,
        `ficlub-scep-${Date.now()}.mobileconfig` // Unique filename to avoid conflicts
      );
      console.log('Writing .mobileconfig to:', filePath);
      await window.electronAPI.fs.writeFile(filePath, new Uint8Array(response.data));
      console.log('Opening .mobileconfig file');
      await window.electronAPI.shell.openPath(filePath); // Queues for installation
      console.log('Opening System Settings > Profiles');
      await window.electronAPI.shell.openExternal('x-apple.systempreferences:com.apple.Profiles-Settings.extension'); // Opens Profiles pane without UI interaction
      $q.notify({
        type: 'positive',
        message: 'Profile queued in System Settings > Profiles. Select the profile in the "Downloaded" section and click "Install".',
        timeout: 5000,
      });
    } else {
      console.log('Entering fallback block');
      // Fallback for non-Electron or non-macOS
      const contentType = response.headers['content-type'] || 'application/x-apple-aspen-config';
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ficlub-scep.mobileconfig';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      $q.notify({
        type: 'warning',
        message: 'Profile downloaded. Open manually in System Settings > Profiles.',
        timeout: 5000,
      });
    }
  } catch (err) {
    if (err.response) {
      if (err.response.status === 401 || err.response.status === 403) {
        error.value = 'Authentication failed. Please log in again.';
        router.push('/login');
      } else {
        error.value = `API error: ${err.response.status} - ${err.response.statusText}`;
      }
    } else {
      error.value = err.message || 'Failed to install configuration profile.';
    }
    console.error('Installation error:', err);
    $q.notify({
      type: 'negative',
      message: error.value,
      timeout: 5000,
    });
  } finally {
    isLoading.value = false;
  }
}

// Auto-trigger for macOS in Electron
onMounted(() => {
  if (isElectron.value && isMacOS.value) {
    console.log('Auto-triggering installProfile');
    installProfile();
  }
});
</script>
