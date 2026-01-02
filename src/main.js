import { createApp } from 'vue'
import App from './App.vue'
// 明确指向现在正确的位置：src/router/index.js
import router from './router/index.js'

const app = createApp(App)

// 必须先加载路由插件
app.use(router)

app.mount('#app')