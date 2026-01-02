<script setup>
import './assets/css/global.css';
import './assets/css/layout.css';
import './assets/css/components.css';
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
      <div style="margin-top: auto; font-size: 20px; color: #555;">lingqiu1700</div>
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
/* 无缝过渡效果：类 Astro transitions */
.page-fade-enter-active, .page-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.page-fade-enter-from {
  opacity: 0;
  transform: translateY(5px);
}
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>