<template>
  <div class="view-wrapper">
    <header class="chat-status-bar">
      <span class="level-badge">当前能力评估: {{ userProfile?.english_level || 'A1' }}</span>
    </header>

    <div class="chat-window" ref="chatBox">
      <div v-for="msg in chatHistory" :key="msg.id" :class="['msg-row', msg.role]">
        <div v-if="msg.role === 'assistant'" class="assistant-content">
          <div v-if="msg.feedback" class="grammar-feedback">
            <span class="icon">💡</span> {{ msg.feedback }}
          </div>
          <div class="bubble">{{ msg.content }}</div>
        </div>
        <div v-else class="bubble">{{ msg.content }}</div>
      </div>

      <div v-if="isLoading" class="msg-row assistant">
        <div class="bubble typing">AI 正在评估你的表达...</div>
      </div>
    </div>

    <div class="input-area">
      <div class="input-box">
        <input v-model="input" @keyup.enter="onSend" placeholder="用英文回复..." />
        <button @click="onSend" :disabled="isLoading">发送</button>
      </div>
    </div>
  </div>
</template>


<script setup>
import { useChatMode } from '../assets/viewsjs/useChatMode.js';
import { userProfile } from '../composables/useAuth';

const { input, isLoading, chatHistory, chatBox, onSend } = useChatMode();
</script>

<style scoped>
.chat-status-bar {
  padding: 10px 20px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-color);
}
.level-badge {
  background: var(--primary-color);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
}
.grammar-feedback {
  background: rgba(255, 184, 0, 0.1);
  border-left: 3px solid #ffb800;
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 4px;
  font-size: 0.9rem;
  color: var(--text-main);
}
</style>