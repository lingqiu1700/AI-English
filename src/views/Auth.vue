<template>
  <div class="view-wrapper auth-container">
    <div class="card auth-card">
      <h2 class="auth-title">{{ isLogin ? '欢迎回来' : '开启学习之旅' }}</h2>
      <p class="auth-subtitle">{{ isLogin ? '请登录你的 AI English 账号' : '创建一个账号以同步你的学习进度' }}</p>

      <form @submit.prevent="handleAuth" class="auth-form">
        <div class="form-group">
          <label>邮箱地址</label>
          <input
              v-model="email"
              type="email"
              placeholder="your@email.com"
              required
              :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label>密码</label>
          <input
              v-model="password"
              type="password"
              placeholder="请输入密码"
              required
              :disabled="loading"
          />
        </div>

        <div v-if="errorMsg" class="error-banner">
          ⚠️ {{ errorMsg }}
        </div>

        <button type="submit" class="auth-btn" :disabled="loading">
          <span v-if="loading">处理中...</span>
          <span v-else>{{ isLogin ? '立即登录' : '注册账号' }}</span>
        </button>
      </form>

      <div class="auth-footer">
        <span>{{ isLogin ? '还没有账号？' : '已经有账号了？' }}</span>
        <a @click="isLogin = !isLogin">{{ isLogin ? '去注册' : '去登录' }}</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';

const { signIn, signUp } = useAuth();
const router = useRouter();

const isLogin = ref(true);
const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMsg = ref('');

const handleAuth = async () => {
  errorMsg.value = '';
  loading.value = true;

  try {
    if (isLogin.value) {
      await signIn(email.value, password.value);
    } else {
      await signUp(email.value, password.value);
      alert('注册成功！请查收邮件确认（如果开启了邮件验证）或尝试登录。');
      isLogin.value = true;
      return;
    }
    // 登录成功后跳转到主页或之前的页面
    router.push('/word');
  } catch (err) {
    errorMsg.value = err.message || '操作失败，请检查网络或输入';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.auth-container {
  justify-content: center;
  align-items: center;
  min-height: 80vh;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  padding: 40px;
  text-align: left;
}

.auth-title {
  margin: 0 0 10px 0;
  font-size: 1.8rem;
  color: var(--primary-color);
}

.auth-subtitle {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  margin-bottom: 8px;
  color: var(--text-main);
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background-color: var(--bg-app);
  color: var(--text-main);
  box-sizing: border-box;
}

.auth-btn {
  width: 100%;
  padding: 14px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  margin-top: 10px;
  transition: opacity 0.3s;
}

.auth-btn:hover {
  opacity: 0.9;
}

.auth-btn:disabled {
  background-color: var(--text-muted);
  cursor: not-allowed;
}

.error-banner {
  background-color: rgba(255, 0, 0, 0.1);
  color: #ff4444;
  padding: 10px;
  border-radius: 6px;
  font-size: 0.85rem;
  margin-bottom: 20px;
}

.auth-footer {
  margin-top: 25px;
  text-align: center;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.auth-footer a {
  color: var(--primary-color);
  cursor: pointer;
  margin-left: 8px;
  text-decoration: underline;
}
</style>