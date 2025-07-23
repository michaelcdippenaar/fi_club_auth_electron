import MainLayout from '../layouts/MainLayout.vue';
import Register from '../pages/Register.vue';
import Login from '../pages/Login.vue';
import Enroll from '../pages/Enroll.vue';
import ErrorNotFound from '../pages/ErrorNotFound.vue';

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', redirect: '/login' }, // Redirect root to /register
      { path: 'register', component: Register },
      { path: 'login', component: Login },
      { path: 'enroll', component: Enroll },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: ErrorNotFound,
  },
];

export default routes;
