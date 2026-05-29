<template>
  <div class="view-wrapper page-shell auth-page">
    <section class="panel auth-panel">
      <div class="page-heading">
        <p class="eyebrow">{{ isLogin ? 'Account login' : 'New learner' }}</p>
        <h1>{{ isLogin ? '欢迎回来' : '创建 AI English 账号' }}</h1>
        <p>{{ isLogin ? '登录后可同步学习记录、收藏单词和个人资料。' : '设置你的专属用户名，开始保存学习进度。' }}</p>
      </div>

      <form class="form-grid" @submit.prevent="handleAuth">
        <label v-if="!isLogin" class="form-field">
          <span>用户名</span>
          <input v-model.trim="username" type="text" minlength="3" maxlength="24" placeholder="例如: lily_english" :disabled="loading" required />
        </label>

        <label class="form-field">
          <span>邮箱地址</span>
          <input v-model.trim="email" type="email" placeholder="your@email.com" :disabled="loading" required />
        </label>

        <label class="form-field">
          <span>密码</span>
          <input v-model="password" type="password" minlength="6" placeholder="至少 6 位密码" :disabled="loading" required />
        </label>

        <p v-if="errorMsg" class="notice error">{{ errorMsg }}</p>
        <p v-if="successMsg" class="notice success">{{ successMsg }}</p>

        <button type="submit" class="primary-btn" :disabled="loading">
          {{ loading ? '处理中...' : isLogin ? '登录' : '注册' }}
        </button>
      </form>

      <div class="switch-line">
        <span>{{ isLogin ? '还没有账号？' : '已经有账号了？' }}</span>
        <button type="button" class="link-btn" @click="toggleMode">{{ isLogin ? '去注册' : '去登录' }}</button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';

const { signIn, signUp } = useAuth();
const route = useRoute();
const router = useRouter();

const isLogin = ref(true);
const username = ref('');
const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMsg = ref('');
const successMsg = ref('');

const toggleMode = () => {
  isLogin.value = !isLogin.value;
  errorMsg.value = '';
  successMsg.value = '';
};

const handleAuth = async () => {
  errorMsg.value = '';
  successMsg.value = '';
  loading.value = true;

  try {
    if (isLogin.value) {
      await signIn(email.value, password.value);
      router.push(route.query.redirect || '/profile');
      return;
    }

    const data = await signUp(email.value, password.value, username.value);
    if (data.session) {
      router.push('/profile');
      return;
    }

    successMsg.value = '注册成功。如果项目开启了邮箱验证，请先完成邮件确认后再登录。';
    isLogin.value = true;
    password.value = '';
  } catch (err) {
    errorMsg.value = err.message || '操作失败，请检查邮箱、密码或网络连接。';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.auth-page {
  align-items: center;
  justify-content: center;
  padding: 32px;
}

.auth-panel {
  width: min(440px, 100%);
}

.switch-line {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 22px;
  color: var(--text-muted);
}
</style>
