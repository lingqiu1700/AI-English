<template>
  <div class="view-wrapper">
    <div class="chat-window" ref="chatBox">
      <div v-for="msg in chatHistory" :key="msg.id" :class="['msg-row', msg.role]">
        <div v-if="msg.role === 'assistant'" class="assistant-content">
          <div v-if="msg.feedback" class="grammar-feedback">
            <span class="icon">提示</span> {{ msg.feedback }}
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

const { input, isLoading, chatHistory, chatBox, onSend } = useChatMode();
</script>

<style scoped>
.grammar-feedback {
  margin-bottom: 8px;
  padding: 8px 12px;
  border-left: 3px solid #ffb800;
  border-radius: 4px;
  color: var(--text-main);
  background: rgba(255, 184, 0, 0.1);
  font-size: 0.9rem;
}

.icon {
  color: #ffb800;
  font-weight: 700;
}
</style>
