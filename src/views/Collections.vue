<template>
  <div class="view-wrapper page-shell">
    <section class="page-heading">
      <p class="eyebrow">Vocabulary</p>
      <h1>我的收藏单词</h1>
      <p>集中复习你在单词模式中收藏的内容。</p>
    </section>

    <section class="panel toolbar-panel">
      <input v-model.trim="keyword" class="search-input" placeholder="搜索单词、音标或释义" />
      <span>{{ filteredWords.length }} / {{ words.length }} 个单词</span>
    </section>

    <section v-if="loading" class="empty-state">正在加载收藏...</section>

    <section v-else-if="filteredWords.length" class="word-grid">
      <article v-for="item in filteredWords" :key="item.id" class="word-card">
        <div>
          <h2>{{ item.word }}</h2>
          <p>{{ item.phonetic || '暂无音标' }}</p>
        </div>
        <ul>
          <li v-for="meaning in normalizeTranslation(item.translation)" :key="meaning">{{ meaning }}</li>
        </ul>
        <button class="ghost-btn danger" @click="removeWord(item)">取消收藏</button>
      </article>
    </section>

    <section v-else class="empty-state">
      <h2>还没有收藏单词</h2>
      <p>去单词模式查询一个单词，然后点击收藏按钮。</p>
      <router-link to="/word" class="primary-link">开始学习单词</router-link>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { currentUser } from '../composables/useAuth';
import { supabase } from '../services/supabase';

const words = ref([]);
const keyword = ref('');
const loading = ref(true);

const normalizeTranslation = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') return [value];
  if (value && typeof value === 'object') return Object.values(value).flat().filter(Boolean);
  return ['暂无释义'];
};

const filteredWords = computed(() => {
  const term = keyword.value.toLowerCase();
  if (!term) return words.value;

  return words.value.filter((item) => {
    const meanings = normalizeTranslation(item.translation).join(' ');
    return `${item.word} ${item.phonetic || ''} ${meanings}`.toLowerCase().includes(term);
  });
});

const fetchCollections = async () => {
  loading.value = true;
  const { data, error } = await supabase
    .from('word_collections')
    .select('*')
    .eq('user_id', currentUser.value.id)
    .order('created_at', { ascending: false });

  if (!error && data) words.value = data;
  loading.value = false;
};

const removeWord = async (item) => {
  const { error } = await supabase
    .from('word_collections')
    .delete()
    .eq('id', item.id)
    .eq('user_id', currentUser.value.id);

  if (!error) words.value = words.value.filter((word) => word.id !== item.id);
};

onMounted(fetchCollections);
</script>

<style scoped>
.toolbar-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.search-input {
  width: min(460px, 100%);
}

.word-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  overflow: auto;
  padding-bottom: 20px;
}

.word-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 220px;
  padding: 18px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-surface);
}

.word-card h2 {
  color: var(--primary-color);
  margin-bottom: 4px;
}

.word-card p,
.word-card li {
  color: var(--text-muted);
}

.word-card ul {
  flex: 1;
  padding-left: 18px;
  line-height: 1.6;
}

.empty-state {
  margin-top: 30px;
  padding: 36px;
  text-align: center;
  color: var(--text-muted);
}

.empty-state h2 {
  color: var(--text-main);
  margin-bottom: 8px;
}

.primary-link {
  display: inline-flex;
  margin-top: 16px;
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 700;
}
</style>
