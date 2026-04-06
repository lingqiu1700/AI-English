import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js'
import { useAuth} from "./composables/useAuth.js";

const app = createApp(App)


const { initializeAuth } = useAuth()
initializeAuth().then(() => {
    app.use(router)

    app.mount('#app')
})
