<script setup>
import { ref, onMounted } from 'vue';
// 只需引入基础变量和布局，组件专属样式已经在 Vue 文件里了
import './assets/css/themes.css';
import './assets/css/layout.css';
import { currentUser, useAuth } from './composables/useAuth';
const { signOut } = useAuth();

// 主题切换逻辑
const isLight = ref(false);

const toggleTheme = () => {
  isLight.value = !isLight.value;
  if (isLight.value) {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }

  const handleSignOut = async () => {
    if (confirm('确定要退出登录吗？')) {
      await signOut();
      window.location.reload(); // 简单粗暴地刷新以清理状态
    }
  };
};
</script>

<template>
  <div class="app-container">
    <aside class="sidebar">
      <div class="brand">AI English</div>
      <nav>
        <router-link to="/word" class="nav-item">🔤 单词模式</router-link>
        <router-link to="/sentence" class="nav-item">📝 句子分析</router-link>
        <router-link to="/chat" class="nav-item">💬 对话训练</router-link>
      </nav>

      <div class="sidebar-footer">
        <div v-if="currentUser" class="user-info">
          <span class="email">{{ currentUser.email.split('@')[0] }}</span>
          <span class="logout-btn" @click="handleSignOut">退出</span>
        </div>
        <router-link v-else to="/login" class="nav-item login-link">🔑 登录/注册</router-link>

        <button class="theme-toggle-btn" @click="toggleTheme">
          {{ isLight ? '🌙切换至暗色' : '☀️切换成白天' }}
        </button>
      </div>
    </aside>

    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style>
/* App.vue 全局过渡动画等补充 */
.page-fade-enter-active, .page-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.page-fade-enter-from { opacity: 0; transform: translateY(5px); }
.page-fade-leave-to { opacity: 0; transform: translateY(-5px); }

/* 切换按钮样式 */
.theme-toggle-btn {
  background-color: var(--bg-surface);
  color: var(--text-main);
  border: 1px solid var(--border-color);
  padding: 10px;
  padding-left: 40px;
  padding-right: 40px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 20px;
}
.theme-toggle-btn:hover {
  border-color: var(--primary-color);
}
.sidebar-footer {
  position: absolute;
  padding: 40px;
  bottom: 40px;
  left: 0;
}


</style>