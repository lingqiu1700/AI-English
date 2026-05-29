<template>
  <div class="view-wrapper page-shell games-page">
    <section class="page-heading">
      <p class="eyebrow">Games</p>
      <h1>英语小游戏</h1>
      <p>用轻量练习把单词拼写、释义判断和反应速度串起来。</p>
    </section>

    <section class="game-layout">
      <div class="game-list">
        <GameCard
          v-for="game in games"
          :key="game.id"
          :title="game.title"
          :description="game.description"
          :mark="game.mark"
          :active="activeGame === game.id"
          @select="selectGame(game.id)"
        />
      </div>

      <section class="panel play-panel">
        <div class="score-row">
          <span>得分: {{ score }}</span>
          <span>连对: {{ streak }}</span>
        </div>

        <template v-if="activeGame === 'scramble'">
          <p class="game-label">把字母重新排列成正确单词，需要提示时再点击查看。</p>

          <div v-if="showHint" class="hint-box">
            <span>{{ scrambleHint }}</span>
            <small v-if="hintLoading">正在优化为 AI 提示...</small>
          </div>
          <button v-else class="ghost-btn hint-btn" @click="revealHint">显示模糊中文提示</button>

          <div class="scramble-word">{{ scrambleText }}</div>
          <input v-model.trim="answer" class="game-input" placeholder="输入完整单词" @keyup.enter="checkScramble" />
          <div class="action-row">
            <button class="primary-btn" @click="checkScramble">提交</button>
            <button class="ghost-btn" @click="nextScramble">换一个</button>
          </div>
        </template>

        <template v-else>
          <p class="game-label">选择最符合单词的中文释义。</p>
          <div class="quiz-word">{{ quizWord.word }}</div>
          <div class="choice-grid">
            <button
              v-for="choice in quizChoices"
              :key="choice"
              class="choice-btn"
              @click="checkQuiz(choice)"
            >
              {{ choice }}
            </button>
          </div>
        </template>

        <p v-if="feedback" class="feedback" :class="feedbackType">{{ feedback }}</p>
      </section>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { AiService } from '../services/ai';
import { userProfile } from '../composables/useAuth';
import GameCard from './components/Comment.vue';

const wordBank = [
  { word: 'garden', meaning: '花园', concept: '植物和小路常在这里' },
  { word: 'planet', meaning: '行星', concept: '围着恒星运行的天体' },
  { word: 'bridge', meaning: '桥梁', concept: '连接两边的通道' },
  { word: 'silver', meaning: '银色的', concept: '像金属一样发亮的颜色' },
  { word: 'travel', meaning: '旅行', concept: '离开熟悉地方去探索' },
  { word: 'bright', meaning: '明亮的', concept: '光线充足或很聪明' },
  { word: 'forest', meaning: '森林', concept: '大片树木聚在一起' },
  { word: 'gentle', meaning: '温柔的', concept: '动作或态度很柔和' },
];

const games = [
  { id: 'scramble', title: 'Word Scramble', description: '需要时查看提示，拼出英文单词。', mark: 'Aa' },
  { id: 'quiz', title: 'Meaning Match', description: '从多个选项中选出正确中文释义。', mark: 'Q' },
];

const activeGame = ref('scramble');
const scrambleIndex = ref(0);
const quizIndex = ref(1);
const answer = ref('');
const score = ref(0);
const streak = ref(0);
const feedback = ref('');
const feedbackType = ref('success');
const scrambleText = ref('');
const scrambleHint = ref('');
const showHint = ref(false);
const hintLoading = ref(false);
const quizChoices = ref([]);

const scrambleWord = computed(() => wordBank[scrambleIndex.value % wordBank.length]);
const quizWord = computed(() => wordBank[quizIndex.value % wordBank.length]);

const shuffle = (value) => {
  const letters = value.split('');
  for (let i = letters.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  const result = letters.join('');
  return result === value ? shuffle(value) : result;
};

const nextDifferentIndex = (current, other) => {
  let next = (current + 1) % wordBank.length;
  if (next === other) next = (next + 1) % wordBank.length;
  return next;
};

const buildChoices = () => {
  const answerItem = quizWord.value;
  const wrongChoices = wordBank
    .filter((item) => item.word !== answerItem.word)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((item) => item.meaning);

  quizChoices.value = [answerItem.meaning, ...wrongChoices].sort(() => Math.random() - 0.5);
};

const resetScrambleHint = () => {
  showHint.value = false;
  hintLoading.value = false;
  scrambleHint.value = scrambleWord.value.concept;
};

const revealHint = async () => {
  const word = scrambleWord.value;
  const requestKey = word.word;

  showHint.value = true;
  hintLoading.value = true;
  scrambleHint.value = word.concept;

  try {
    const result = await AiService.generateGameHint(word.word, word.meaning, userProfile.value?.english_level || 'A1');
    if (scrambleWord.value.word === requestKey && result?.hint) {
      scrambleHint.value = result.hint;
    }
  } catch (err) {
    scrambleHint.value = word.concept;
  } finally {
    if (scrambleWord.value.word === requestKey) hintLoading.value = false;
  }
};

watch(scrambleIndex, () => {
  scrambleText.value = shuffle(scrambleWord.value.word);
  resetScrambleHint();
}, { immediate: true });

watch(quizIndex, buildChoices, { immediate: true });

const selectGame = (id) => {
  if (activeGame.value === id) return;
  activeGame.value = id;
  feedback.value = '';
  answer.value = '';

  if (id === 'scramble') {
    scrambleIndex.value = nextDifferentIndex(scrambleIndex.value, quizIndex.value);
  } else {
    quizIndex.value = nextDifferentIndex(quizIndex.value, scrambleIndex.value);
  }
};

const markResult = (right, text) => {
  feedback.value = text;
  feedbackType.value = right ? 'success' : 'error';

  if (!right) {
    streak.value = 0;
    return;
  }

  score.value += 10;
  streak.value += 1;
  answer.value = '';

  if (activeGame.value === 'scramble') {
    scrambleIndex.value = nextDifferentIndex(scrambleIndex.value, quizIndex.value);
  } else {
    quizIndex.value = nextDifferentIndex(quizIndex.value, scrambleIndex.value);
  }
};

const checkScramble = () => {
  const right = answer.value.toLowerCase() === scrambleWord.value.word;
  markResult(right, right ? '回答正确，继续下一题。' : `还差一点，答案是 ${scrambleWord.value.word}。`);
};

const nextScramble = () => {
  scrambleIndex.value = nextDifferentIndex(scrambleIndex.value, quizIndex.value);
  answer.value = '';
  feedback.value = '';
};

const checkQuiz = (choice) => {
  const right = choice === quizWord.value.meaning;
  markResult(right, right ? '选择正确。' : `正确释义是 ${quizWord.value.meaning}。`);
};
</script>

<style scoped>
.game-layout {
  display: grid;
  grid-template-columns: 420px minmax(0, 1fr);
  gap: 20px;
}

.game-list {
  display: grid;
  gap: 12px;
  align-content: start;
}

.play-panel {
  min-height: 460px;
}

.score-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px;
  color: var(--text-muted);
  font-weight: 700;
}

.game-label {
  margin: 0 0 12px;
  color: var(--text-muted);
}

.hint-btn {
  margin-bottom: 14px;
}

.hint-box {
  display: inline-grid;
  gap: 4px;
  margin-bottom: 14px;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-main);
  background: var(--bg-app);
}

.hint-box small {
  color: var(--text-muted);
  font-size: 0.78rem;
}

.scramble-word,
.quiz-word {
  margin-bottom: 18px;
  color: var(--primary-color);
  font-size: clamp(2rem, 6vw, 4rem);
  font-weight: 900;
  letter-spacing: 0.04em;
}

.game-input {
  width: 100%;
  max-width: 420px;
  margin-bottom: 14px;
  padding: 13px 14px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-main);
  background: var(--bg-app);
}

.choice-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.choice-btn {
  min-height: 58px;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-main);
  background: var(--bg-app);
}

.choice-btn:hover {
  color: var(--primary-color);
  border-color: var(--primary-color);
}

.feedback {
  margin-top: 18px;
  font-weight: 700;
}

.feedback.success {
  color: var(--primary-color);
}

.feedback.error {
  color: var(--danger-color);
}

@media (max-width: 980px) {
  .game-layout {
    grid-template-columns: 1fr;
  }
}
</style>
