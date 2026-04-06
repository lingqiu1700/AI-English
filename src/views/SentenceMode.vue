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

<style scoped>
.msg-row {
  margin-bottom: 20px;
  display: flex;
}
.msg-row.user { justify-content: flex-end; }
.bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 12px;
}
.user .bubble { background-color: var(--bg-user-msg); }
.assistant .bubble { background-color: var(--bg-surface); border: 1px solid var(--border-color); }

/* 句子解析专属卡片 */
.sentence-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
  width: 100%;
  max-width: 700px;
}

.section {
  margin-bottom: 15px;
}

.section label {
  font-size: 0.85em;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  display: block;
  margin-bottom: 5px;
}

.trans-text {
  font-size: 1.1em;
  color: var(--primary-color);
  margin: 0;
}

.structure-code {
  display: block;
  background-color: rgba(0,0,0,0.1);
  padding: 10px;
  border-radius: 6px;
  font-family: monospace;
  color: var(--text-main);
}
html[data-theme="light"] .structure-code {
  background-color: #f4f4f4; /* 白天模式代码块背景 */
}

.grammar-list {
  margin: 0;
  padding-left: 20px;
  color: var(--text-main);
}

.private-note-box {
  margin-top: 15px;
  padding: 10px;
  border-left: 4px solid var(--primary-color);
  background-color: var(--bg-app);
}
</style>