<template>
  <div class="app-container">
    <aside class="sidebar">
      <router-link to="/word" class="brand">AI English</router-link>

      <nav class="main-nav">
        <router-link to="/word" class="nav-item" @click="createNew('word')">
          <span class="nav-icon">Aa</span>
          <span>单词模式</span>
        </router-link>
        <router-link to="/sentence" class="nav-item" @click="createNew('sentence')">
          <span class="nav-icon">S</span>
          <span>句子分析</span>
        </router-link>
        <router-link to="/chat" class="nav-item" @click="createNew('chat')">
          <span class="nav-icon">C</span>
          <span>对话训练</span>
        </router-link>
        <router-link to="/collections" class="nav-item">
          <span class="nav-icon">★</span>
          <span>收藏单词</span>
        </router-link>
        <router-link to="/games" class="nav-item">
          <span class="nav-icon">G</span>
          <span>英语小游戏</span>
        </router-link>
      </nav>

      <section class="history-container" v-if="currentUser">
        <div class="history-label">最近活动</div>
        <div class="history-list">
          <button
            v-for="item in sessions"
            :key="item.id"
            class="history-item"
            :class="{ active: currentSessionId === item.id }"
            @click="loadHistory(item)"
          >
            <span class="history-type">{{ getHistoryLabel(item.mode) }}</span>
            <span class="history-title">{{ item.title }}</span>
            <span class="del-btn" @click.stop="deleteSession(item.id)">×</span>
          </button>
        </div>
      </section>

      <div class="sidebar-footer">
        <label class="model-selector">
          <span>AI 模型</span>
          <select v-model="selectedProvider" @change="saveProvider">
            <option value="gemini">Google Gemini</option>
            <option value="qwen">通义千问</option>
          </select>
        </label>

        <button class="theme-toggle-btn" @click="toggleTheme">
          {{ isLight ? '切换深色' : '切换浅色' }}
        </button>
      </div>
    </aside>

    <main class="main-content">
      <header class="topbar">
        <router-link v-if="currentUser" to="/profile" class="account-entry">
          <span class="avatar">{{ displayName.slice(0, 1).toUpperCase() }}</span>
          <span class="account-text">
            <strong>{{ displayName }}</strong>
            <small>英语水平 {{ currentLevel }}</small>
          </span>
        </router-link>
        <router-link v-else to="/login" class="login-entry">登录</router-link>
      </header>

      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import './assets/css/global.css';
import './assets/css/layout.css';
import './assets/css/components.css';
import { currentUser, userProfile } from './composables/useAuth';
import { currentSessionId, useChatSession, sessions } from './assets/viewsjs/useChatSession';

const router = useRouter();
const { fetchSessions, deleteSession } = useChatSession();

const isLight = ref(localStorage.getItem('theme') === 'light');
const selectedProvider = ref(localStorage.getItem('ai_provider') || 'gemini');

const displayName = computed(() => {
  return userProfile.value?.username || currentUser.value?.email?.split('@')[0] || '用户';
});

const currentLevel = computed(() => userProfile.value?.english_level || 'A1');

onMounted(() => {
  document.documentElement.setAttribute('data-theme', isLight.value ? 'light' : 'dark');
  if (currentUser.value) fetchSessions();
});

watch(currentUser, (user) => {
  if (user) fetchSessions();
  else {
    sessions.value = [];
    currentSessionId.value = null;
  }
});

const createNew = (mode) => {
  currentSessionId.value = null;
  router.push(`/${mode}`);
};

const loadHistory = (item) => {
  currentSessionId.value = item.id;
  router.push(`/${item.mode}`);
};

const getHistoryLabel = (mode) => ({ word: '单词', sentence: '句子', chat: '对话' }[mode] || '记录');

const saveProvider = () => localStorage.setItem('ai_provider', selectedProvider.value);

const toggleTheme = () => {
  isLight.value = !isLight.value;
  const theme = isLight.value ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
};
</script>

<style>
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
