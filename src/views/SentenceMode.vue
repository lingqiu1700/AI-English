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
        <div class="bubble typing">AI 正在拆解语法结构...</div>
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
import { useSentenceMode } from '../assets/viewsjs/useSentenceMode.js';
const { input, isLoading, chatHistory, onSend } = useSentenceMode();
</script>

<style scoped>
.msg-row { margin-bottom: 20px; display: flex; }
.msg-row.user { justify-content: flex-end; }
.bubble { max-width: 70%; padding: 12px 16px; border-radius: 12px; }
.user .bubble { background-color: var(--bg-user-msg); }
.assistant .bubble { background-color: var(--bg-surface); border: 1px solid var(--border-color); }

.sentence-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
  width: 100%;
  max-width: 700px;
}
.section { margin-bottom: 15px; }
.section label { font-size: 0.85em; color: var(--text-muted); text-transform: uppercase; display: block; margin-bottom: 5px; }
.trans-text { font-size: 1.1em; color: var(--primary-color); margin: 0; }
.structure-code { display: block; background-color: rgba(0,0,0,0.1); padding: 10px; border-radius: 6px; font-family: monospace; }
.grammar-list { margin: 0; padding-left: 20px; }
.private-note-box { margin-top: 15px; padding: 10px; border-left: 4px solid var(--primary-color); background-color: var(--bg-app); }
</style>