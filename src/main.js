import { createApp } from 'vue';
import mitt from 'mitt';
import App from './App.vue';
import router from './router/index.js';
import { useAuth } from './composables/useAuth.js';

const app = createApp(App);
const bus = mitt();
const { initializeAuth } = useAuth();

app.config.globalProperties.$bus = bus;

initializeAuth().then(() => {
  app.use(router);
  app.mount('#app');
});
