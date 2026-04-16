<script setup>
import {useWordMode} from "../assets/viewsjs/useWordMode.js";

const {
  input,
  isLoading,
  chatHistory,
  onSend,
  isCollected,
  toggleCollect
} = useWordMode();
</script>

<template>
  <div class="view-wrapper">
    <div class="chat-window">
      <div v-for="msg in chatHistory" :key="msg.id" :class="['msg-row', msg.role]">
        <div v-if="msg.type === 'text'" class="bubble">
          {{ msg.content }}
        </div>

        <div v-else-if="msg.type === 'card'" class="card">
          <div class="card-header">
            <h2>
              <span>{{ msg.data.word }} <small>{{ msg.data.phonetic }}</small></span>
              <button
                  @click="toggleCollect(msg.data)"
                  class="collect-btn"
                  :class="{ 'active': isCollected(msg.data.word) }"
              >
                {{ isCollected(msg.data.word) ? '★ 已收藏' : '☆ 收藏' }}
              </button>
            </h2>
            <p class="pos-tag">{{ msg.data.pos }}</p>
          </div>

          <div class="content-section">
            <strong>中文释义：</strong>
            <div v-for="def in msg.data.definitions" :key="def" class="def-item">{{ def }}</div>
          </div>

          <div v-if="msg.data.mnemonic" class="mnemonic-box">
            <strong>💡 助记：</strong> {{ msg.data.mnemonic }}
          </div>
        </div>
      </div>

      <div v-if="isLoading" class="msg-row assistant">
        <div class="bubble typing">AI 正在查阅词典并分析中...</div>
      </div>
    </div>

    <div class="input-area">
      <div class="input-box">
        <input
            v-model="input"
            placeholder="输入单词以获取详细解释..."
            @keyup.enter="onSend"
            :disabled="isLoading"
        />
        <button @click="onSend" :disabled="isLoading">
          {{ isLoading ? '...' : '搜索' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.msg-row {
  margin-bottom: 20px;
  display: flex;
  padding-top: 20px;
  padding-left: 10px;
}

.msg-row.user {
  justify-content: flex-end;
}

.bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.5;
}

.user .bubble {
  background-color: var(--bg-user-msg);
  color: var(--text-main);
}

.assistant .bubble {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-color);
}

/* 单词专属卡片 */
.card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.card h2 {
  margin-top: 0;
  color: var(--primary-color) !important;
}

.content-section {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px dashed var(--border-color);
}

.mnemonic-box {
  background-color: rgba(66, 184, 131, 0.05);
  border: 1px solid rgba(66, 184, 131, 0.2);
  color: var(--text-main);
}
/* 白天模式下的特殊适配 */
html[data-theme="light"] .mnemonic-box {
  background-color: #f9f9f9;
  border-color: #eeeeee;
}

.card-header h2 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0;
}

.collect-btn {
  font-size: 0.85rem;
  padding: 4px 10px;
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-muted);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.collect-btn.active {
  color: #ffb800;
  border-color: #ffb800;
  background: rgba(255, 184, 0, 0.05);
}

.pos-tag {
  margin: 5px 0;
  color: var(--text-muted);
  font-style: italic;
}

.def-item {
  margin: 4px 0;
  color: var(--text-main);
}
</style>