<script setup>
import { ref } from 'vue';
import { AiService } from '../services/ai.js'; //

const input = ref('');
const isLoading = ref(false);
const chatHistory = ref([{ id: 1, role: 'assistant', content: '请输入你想学习的单词。', type: 'text' }]);

// 权威词典 API
async function fetchStandardDict(word) {
  const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
  if (!res.ok) return null;
  const data = await res.json();
  return {
    phonetic: data[0].phonetic,
    pos: data[0].meanings[0].partOfSpeech,
    baseDef: data[0].meanings[0].definitions[0].definition
  };
}

const onSend = async () => {
  if (!input.value.trim() || isLoading.value) return;

  const word = input.value;
  chatHistory.value.push({ id: Date.now(), role: 'user', content: word, type: 'text' });

  isLoading.value = true;
  input.value = '';

  try {
    const dictData = await fetchStandardDict(word);
    const aiResult = await AiService.analyzeWord(word, dictData); //

    chatHistory.value.push({
      id: Date.now() + 1,
      role: 'assistant',
      type: 'card',
      data: {
        word: word,
        phonetic: aiResult.phonetic || dictData?.phonetic,
        pos: aiResult.pos || dictData?.pos,
        definitions: aiResult.chinese_meanings,
        mnemonic: aiResult.mnemonic,
        examples: aiResult.examples
      }
    });
  } catch (e) {
    console.error(e);
    chatHistory.value.push({ id: Date.now() + 2, role: 'assistant', content: '抱歉，AI 解析失败，请检查 .env 配置或网络。', type: 'text' });
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="view-wrapper">
    <div class="chat-window">
      <div v-for="msg in chatHistory" :key="msg.id" :class="['msg-row', msg.role]">
        <div v-if="msg.type === 'text'" class="bubble">
          {{ msg.content }}
        </div>

        <div v-else-if="msg.type === 'card'" class="card">
          <h2 style="color: var(--primary-green)">{{ msg.data.word }} <small>{{ msg.data.phonetic }}</small></h2>
          <p style="margin: 5px 0; color: #888;">{{ msg.data.pos }}</p>
          <div class="content-section">
            <strong>中文释义：</strong>
            <div v-for="def in msg.data.definitions" :key="def">{{ def }}</div>
          </div>
          <div v-if="msg.data.mnemonic" class="mnemonic-box" style="margin-top: 10px; padding: 10px; background: rgba(66, 184, 131, 0.1); border-radius: 8px;">
            <strong>💡 助记：</strong> {{ msg.data.mnemonic }}
          </div>
        </div>
      </div>

      <div v-if="isLoading" class="msg-row assistant">
        <div class="bubble">AI 正在查阅词典并分析中...</div>
      </div>
    </div>

    <div class="input-area">
      <div class="input-box">
        <input v-model="input" placeholder="输入单词以获取详细解释..." @keyup.enter="onSend" />
        <button @click="onSend" :disabled="isLoading">搜索</button>
      </div>
    </div>
  </div>
</template>