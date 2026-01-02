import { createRouter, createWebHistory } from 'vue-router'

// 注意：这里必须是 ../ 表示跳出 router 文件夹进入 src 目录，然后再进 views
import WordMode from '../views/WordMode.vue'
import SentenceMode from '../views/SentenceMode.vue'
import ChatMode from '../views/ChatMode.vue'

const routes = [
    { path: '/', redirect: '/word' },
    { path: '/word', component: WordMode },
    { path: '/sentence', component: SentenceMode },
    { path: '/chat', component: ChatMode }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router