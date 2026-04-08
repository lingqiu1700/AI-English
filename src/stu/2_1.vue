<template>
  <div class="timer-container">
    <h2>计时器</h2>
    <div class="time-display">{{ formattedTime }}</div>
    <div class="controls">
      <button @click="startTimer" class="btn">开始</button>
      <button @click="pauseTimer" class="btn">暂停</button>
      <button @click="resetTimer" class="btn">重置</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const seconds = ref(0)
const isRunning = ref(false)
let timerId = null

const formattedTime = computed(() => {
  const m = Math.floor(seconds.value / 60).toString().padStart(2, '0')
  const s = (seconds.value % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})


const startTimer = () => {
  if (isRunning.value) return
  isRunning.value = true
  timerId = setInterval(() => {
    seconds.value++
  }, 1000)
}

const pauseTimer = () => {
  isRunning.value = false
  if (timerId) clearInterval(timerId)
}

const resetTimer = () => {
  pauseTimer()
  seconds.value = 0
}

const saveState = () => {
  localStorage.setItem('savedSeconds', seconds.value)
  localStorage.setItem('savedIsRunning', isRunning.value)
}


onMounted(() => {

  const savedSecs = localStorage.getItem('savedSeconds')
  const savedRunning = localStorage.getItem('savedIsRunning')

  if (savedSecs) {
    seconds.value = parseInt(savedSecs)
  }

  if (savedRunning === 'true') {
    startTimer()
  }

  window.addEventListener('beforeunload', saveState)
})

onUnmounted(() => {
  if (timerId) clearInterval(timerId)
  window.removeEventListener('beforeunload', saveState)
})
</script>

<style scoped>
.timer-container {
  border: 1px solid #ccc;
  padding: 20px;
  width: 300px;
  text-align: center;
}
.time-display {
  font-size: 2em;
  font-weight: bold;
  margin: 20px 0;
}
.btn {
  background-color: #555;
  color: white;
  border: none;
  padding: 8px 15px;
  margin: 0 5px;
  cursor: pointer;
}
</style>