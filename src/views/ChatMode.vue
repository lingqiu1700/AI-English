<template>
  <div class="view-wrapper">
    <header class="chat-status-bar" v-if="detectedLevel">
      <span class="level-badge">当前推断水平: {{ detectedLevel }}</span>
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
        <div class="bubble typing">AI 正在评估你的水平并做出相应的回答...</div>
      </div>
    </div>

    <div class="input-area">
      <div class="input-box">
        <input
            v-model="input"
            placeholder="Type in English to start chatting..."
            @keyup.enter="onSend"
            :disabled="isLoading"
        />
        <button @click="onSend" :disabled="isLoading">Chat</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import { AiService } from '../services/ai.js';

const input = ref('');
const isLoading = ref(false);
const detectedLevel = ref('');
const chatBox = ref(null);
const chatHistory = ref([
  { id: 1, role: 'assistant', content: "Hello! I'm your English tutor. What would you like to talk about today?", feedback: '' }
]);

const scrollToBottom = async () => {
  await nextTick();
  if (chatBox.value) {
    chatBox.value.scrollTop = chatBox.value.scrollHeight;
  }
};

// src/views/ChatMode.vue 逻辑修正
const onSend = async () => {
  if (!input.value.trim() || isLoading.value) return;

  const text = input.value;
  chatHistory.value.push({ id: Date.now(), role: 'user', content: text });

  isLoading.value = true;
  input.value = '';
  await scrollToBottom();

  try {
    // 关键修正：定义并提取对话历史
    const historyForAi = chatHistory.value.slice(-5).map(m => ({
      role: m.role,
      content: m.content
    }));

    // 现在调用就不会报错了
    const result = await AiService.chatAdaptive(historyForAi, text);

    detectedLevel.value = result.detected_level; // 修正：使用 .value

    chatHistory.value.push({
      id: Date.now() + 1,
      role: 'assistant',
      content: result.reply,
      feedback: result.feedback
    });
  } catch (e) {
    console.error("Chat Error:", e);
    chatHistory.value.push({
      id: Date.now() + 2,
      role: 'assistant',
      content: "Sorry, I'm having trouble connecting to the AI brain.",
      feedback: ''
    });
  } finally {
    isLoading.value = false;
    await scrollToBottom();
  }
};
</script>