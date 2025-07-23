import { boot } from 'quasar/wrappers';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/quasar/api',
  withCredentials: true,
});

export default boot(({ app }) => {
  app.config.globalProperties.$axios = api;
});

export { api };
