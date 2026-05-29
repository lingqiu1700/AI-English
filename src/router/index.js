import { createRouter, createWebHistory } from 'vue-router';
import { currentUser } from '../composables/useAuth.js';
import WordMode from '../views/WordMode.vue';
import ChatMode from '../views/ChatMode.vue';
import GameCenter from '../stu/2_1.vue';

const routes = [
  { path: '/', redirect: '/word' },
  { path: '/word', component: WordMode },
  { path: '/sentence', component: () => import('../views/SentenceMode.vue'), meta: { requiresAuth: true } },
  { path: '/chat', component: ChatMode },
  { path: '/collections', component: () => import('../views/Collections.vue'), meta: { requiresAuth: true } },
  { path: '/profile', component: () => import('../views/Profile.vue'), meta: { requiresAuth: true } },
  { path: '/games', component: GameCenter },
  { path: '/2_1', redirect: '/games' },
  { path: '/login', component: () => import('../views/Auth.vue') },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const isAuth = Boolean(currentUser.value);

  if (to.meta.requiresAuth && !isAuth) {
    return next({ path: '/login', query: { redirect: to.fullPath } });
  }

  if (to.path === '/login' && isAuth) {
    return next('/profile');
  }

  next();
});

export default router;
