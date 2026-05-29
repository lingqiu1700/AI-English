<template>
  <button type="button" class="game-card" :class="{ active }" @click="$emit('select')">
    <span class="game-mark">{{ mark }}</span>
    <span class="game-copy">
      <strong>{{ title }}</strong>
      <small>{{ description }}</small>
    </span>
    <span class="game-status">{{ active ? '练习中' : '切换' }}</span>
  </button>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
  mark: { type: String, required: true },
  active: { type: Boolean, default: false },
});

defineEmits(['select']);
</script>

<style scoped>
.game-card {
  display: grid;
  grid-template-columns: 52px 1fr auto;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-main);
  background: var(--bg-surface);
  text-align: left;
}

.game-card:hover,
.game-card.active {
  border-color: var(--primary-color);
}

.game-mark {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 8px;
  color: white;
  background: var(--primary-color);
  font-weight: 800;
}

.game-copy {
  display: grid;
  gap: 4px;
}

.game-copy strong {
  font-size: 1rem;
}

.game-copy small,
.game-status {
  color: var(--text-muted);
  line-height: 1.5;
}

.game-status {
  font-size: 0.82rem;
  font-weight: 700;
}

@media (max-width: 620px) {
  .game-card {
    grid-template-columns: 44px 1fr;
  }

  .game-status {
    grid-column: 2;
  }
}
</style>
