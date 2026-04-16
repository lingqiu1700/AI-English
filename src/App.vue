<template>
  <div class="app-container">
    <aside class="sidebar">
      <div class="brand">AI English</div>

      <nav class="main-nav">
        <router-link to="/word" class="nav-item" @click="createNew('word')">🔤 单词模式</router-link>
        <router-link to="/sentence" class="nav-item" @click="createNew('sentence')">📝 句子分析</router-link>
        <router-link to="/chat" class="nav-item" @click="createNew('chat')">💬 对话训练</router-link>
      </nav>

      <div class="history-container" v-if="currentUser">
        <div class="history-label">最近活动</div>
        <div class="history-list">
          <div
              v-for="item in sessions"
              :key="item.id"
              class="history-item"
              :class="{ active: currentSessionId === item.id }"
              @click="loadHistory(item)"
          >
            <span class="history-icon">{{ getIcon(item.mode) }}</span>
            <span class="history-title">{{ item.title }}</span>
            <span class="del-btn" @click.stop="deleteSession(item.id)">×</span>
          </div>
        </div>
      </div>

      <div class="sidebar-footer">
        <div class="model-selector">
          <select v-model="selectedProvider" @change="saveProvider">
            <option value="gemini">Google Gemini</option>
            <option value="qwen">通义千问</option>
          </select>
        </div>

        <div v-if="currentUser" class="user-info">
          <span class="email">{{ currentUser.email.split('@')[0] }}</span>
          <span class="logout-btn" @click="handleSignOut">退出</span>
        </div>

        <button class="theme-toggle-btn" @click="toggleTheme">
          {{ isLight ? '🌙 切换暗色' : '☀️ 切换白天' }}
        </button>
      </div>
    </aside>

    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <KeepAlive>
            <component :is="Component" />
          </KeepAlive>
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
// 导入顺序：基础变量 -> 布局 -> 组件
import './assets/css/global.css';
import './assets/css/layout.css';
import './assets/css/components.css';
import { currentUser, useAuth } from './composables/useAuth';
import { useChatSession, currentSessionId, sessions } from './assets/viewsjs/useChatSession';

const router = useRouter();
const { signOut } = useAuth();
const { fetchSessions, deleteSession } = useChatSession();

// 从本地存储初始化主题和模型偏好
const isLight = ref(localStorage.getItem('theme') === 'light');
const selectedProvider = ref(localStorage.getItem('ai_provider') || 'gemini');

onMounted(() => {
  if (currentUser.value) fetchSessions();
  // 初始化主题渲染
  document.documentElement.setAttribute('data-theme', isLight.value ? 'light' : 'dark');
});

// 新建会话逻辑
const createNew = (mode) => {
  currentSessionId.value = null; // 重置当前 ID 开启新上下文
  router.push(`/${mode}`);
};

// 加载历史会话
const loadHistory = (item) => {
  currentSessionId.value = item.id;
  router.push(`/${item.mode}`);
};

// 侧边栏图标映射
const getIcon = (mode) => ({ word: '🔤', sentence: '📝', chat: '💬' }[mode]);

// 保存模型选择
const saveProvider = () => localStorage.setItem('ai_provider', selectedProvider.value);

// 主题切换
const toggleTheme = () => {
  isLight.value = !isLight.value;
  const theme = isLight.value ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
};

// 退出登录
const handleSignOut = async () => {
  if (confirm('确定要退出登录吗？')) {
    await signOut();
    window.location.reload();
  }
};
</script>

<style>
/* 全局动画样式：不建议写在 scoped 中 */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: all 0.3s ease;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>

<style scoped>
/* 侧边栏专属布局样式 */
.history-container { flex: 1; overflow-y: auto; margin-top: 20px; border-top: 1px solid var(--border-color); }
.history-label { padding: 15px 20px 5px; font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }

.history-item {
  display: flex; align-items: center; padding: 10px 15px; margin: 2px 10px;
  border-radius: 8px; cursor: pointer; transition: all 0.2s; position: relative;
  color: var(--text-main);
}
.history-item:hover { background: rgba(255, 255, 255, 0.05); }
.history-item.active { background: var(--bg-surface); color: var(--primary-color); border: 1px solid var(--border-color); }

.history-title { font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
.history-icon { margin-right: 10px; opacity: 0.7; }

.del-btn { opacity: 0; font-size: 18px; padding: 0 5px; color: var(--text-muted); transition: 0.2s; }
.history-item:hover .del-btn { opacity: 0.5; }
.del-btn:hover { opacity: 1 !important; color: #ff4d4d; }

.sidebar { display: flex; flex-direction: column; height: 100vh; }
.main-nav { display: flex; flex-direction: column; padding: 10px; }
.sidebar-footer { padding: 20px; border-top: 1px solid var(--border-color); background: var(--bg-sidebar); }

.user-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; font-size: 14px; }
.logout-btn { color: #ff4d4d; cursor: pointer; text-decoration: underline; }

.theme-toggle-btn {
  width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color);
  background: var(--bg-surface); color: var(--text-main); cursor: pointer; transition: 0.2s;
}
.theme-toggle-btn:hover { border-color: var(--primary-color); }

.model-selector select {
  width: 100%; padding: 8px; margin-bottom: 15px; border-radius: 6px;
  background: var(--bg-app); color: var(--text-main); border: 1px solid var(--border-color);
}
</style>