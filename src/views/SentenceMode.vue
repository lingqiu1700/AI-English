<template>
  <div class="view-wrapper">
    <div class="chat-window">
      <div v-for="msg in chatHistory" :key="msg.id" :class="['msg-row', msg.role]">
        <div v-if="msg.role === 'user'" class="bubble">{{ msg.content }}</div>

        <div v-else-if="msg.type === 'analysis'" class="card sentence-card">
          <div class="section">
            <label>中文翻译</label>
            <p class="trans-text">{{ msg.data.trans }}</p>
          </div>

          <div class="section">
            <label>句子结构</label>
            <code class="structure-code">{{ msg.data.structure }}</code>
          </div>

          <div class="section">
            <label>语法解析</label>
            <ul class="grammar-list">
              <li v-for="(point, idx) in msg.data.grammar" :key="idx">{{ point }}</li>
            </ul>
          </div>

          <div v-if="msg.data.private_note" class="private-note-box">
            <small>💡 开发者笔记：</small>
            <p>{{ msg.data.private_note }}</p>
          </div>
        </div>

        <div v-else class="bubble">{{ msg.content }}</div>
      </div>

      <div v-if="isLoading" class="msg-row assistant">
        <div class="bubble">Gemini 正在拆解语法结构...</div>
      </div>
    </div>

    <div class="input-area">
      <div class="input-box">
        <input
            v-model="input"
            placeholder="输入英语句子，分析其结构与语法..."
            @keyup.enter="onSend"
            :disabled="isLoading"
        />
        <button @click="onSend" :disabled="isLoading">
          {{ isLoading ? '分析中...' : '分析' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { AiService } from '../services/ai.js';

const input = ref('');
const isLoading = ref(false);
const chatHistory = ref([
  { id: 1, role: 'assistant', content: '你好！发给我一个长句子，我会为你拆解它的语法。' }
]);

const onSend = async () => {
  if (!input.value.trim() || isLoading.value) return;

  const sentence = input.value;
  chatHistory.value.push({ id: Date.now(), role: 'user', content: sentence });

  isLoading.value = true;
  input.value = '';

  try {
    // 调用 Gemini 进行句子分析
    const result = await AiService.analyzeSentence(sentence);

    chatHistory.value.push({
      id: Date.now() + 1,
      role: 'assistant',
      type: 'analysis',
      data: result
    });
  } catch (e) {
    chatHistory.value.push({
      id: Date.now() + 2,
      role: 'assistant',
      content: '分析失败，请检查网络或 API Key 状态。'
    });
  } finally {
    isLoading.value = false;
  }
};
</script>