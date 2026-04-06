import { createRouter, createWebHistory } from 'vue-router'
import { currentUser } from "../composables/useAuth.js";

// 注意：这里必须是 ../ 表示跳出 router 文件夹进入 src 目录，然后再进 views
import WordMode from '../views/WordMode.vue'
import SentenceMode from '../views/SentenceMode.vue'
import ChatMode from '../views/ChatMode.vue'
import stu from '../stu/2_1.vue'

const routes = [
    { path: '/', redirect: '/word' },
    { path: '/word', component: WordMode },
    { path: '/sentence', component: () => import('../views/SentenceMode.vue'), meta: { requiresAuth: true } },
    { path: '/chat', component: ChatMode },
    { path: '/login', component: () => import('../views/Auth.vue')},
    { path: '/2_1', component: stu}
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// src/router/index.js

router.beforeEach((to, from, next) => {
    const isAuth = !!currentUser.value;

    if (to.meta.requiresAuth && !isAuth) {
        // 逻辑 1：需要登录但未登录，跳转并【返回】，确保不再执行后面的 next()
        return next('/login');
    }

    if (to.path === '/login' && isAuth) {
        // 逻辑 2：已登录用户尝试去登录页，直接送去主页并【返回】
        return next('/word');
    }

    // 逻辑 3：其他情况，正常放行
    next();
});

export default router