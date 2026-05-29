<template>
  <div class="view-wrapper page-shell">
    <section class="page-heading">
      <p class="eyebrow">Profile</p>
      <h1>个人资料</h1>
      <p>管理你的用户名、英语水平和账号信息。</p>
    </section>

    <div class="profile-grid">
      <section class="panel">
        <form class="form-grid" @submit.prevent="saveProfile">
          <label class="form-field">
            <span>自定义用户名</span>
            <input v-model.trim="form.username" minlength="3" maxlength="24" placeholder="输入 3-24 个字符" />
          </label>

          <label class="form-field">
            <span>姓名或昵称</span>
            <input v-model.trim="form.full_name" maxlength="40" placeholder="可选" />
          </label>

          <label class="form-field">
            <span>英语水平</span>
            <select v-model="form.english_level">
              <option v-for="level in levels" :key="level" :value="level">{{ level }}</option>
            </select>
          </label>

          <p v-if="message" class="notice success">{{ message }}</p>
          <p v-if="error" class="notice error">{{ error }}</p>

          <div class="action-row">
            <button class="primary-btn" :disabled="saving">{{ saving ? '保存中...' : '保存资料' }}</button>
            <button type="button" class="ghost-btn danger" @click="handleSignOut">退出登录</button>
          </div>
        </form>
      </section>

      <aside class="panel profile-summary">
        <div class="profile-avatar">{{ displayInitial }}</div>
        <h2>{{ form.username || '学习者' }}</h2>
        <p>{{ currentUser?.email }}</p>

        <div class="stat-grid">
          <div>
            <strong>{{ stats.collections }}</strong>
            <span>收藏单词</span>
          </div>
          <div>
            <strong>{{ stats.sessions }}</strong>
            <span>学习记录</span>
          </div>
          <div>
            <strong>{{ form.english_level }}</strong>
            <span>当前等级</span>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { currentUser, userProfile, useAuth } from '../composables/useAuth';
import { supabase } from '../services/supabase';

const router = useRouter();
const { updateProfile, signOut, fetchProfile } = useAuth();

const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const saving = ref(false);
const message = ref('');
const error = ref('');
const stats = reactive({ collections: 0, sessions: 0 });
const form = reactive({
  username: '',
  full_name: '',
  english_level: 'A1',
});

const displayInitial = computed(() => (form.username || currentUser.value?.email || 'U').slice(0, 1).toUpperCase());

const syncForm = () => {
  form.username = userProfile.value?.username || currentUser.value?.email?.split('@')[0] || '';
  form.full_name = userProfile.value?.full_name || '';
  form.english_level = userProfile.value?.english_level || 'A1';
};

watch(userProfile, syncForm, { immediate: true });

const loadStats = async () => {
  if (!currentUser.value) return;

  const [{ count: collections }, { count: sessions }] = await Promise.all([
    supabase.from('word_collections').select('id', { count: 'exact', head: true }).eq('user_id', currentUser.value.id),
    supabase.from('chat_sessions').select('id', { count: 'exact', head: true }).eq('user_id', currentUser.value.id),
  ]);

  stats.collections = collections || 0;
  stats.sessions = sessions || 0;
};

const saveProfile = async () => {
  message.value = '';
  error.value = '';
  saving.value = true;

  try {
    await updateProfile({
      username: form.username,
      full_name: form.full_name || null,
      english_level: form.english_level,
    });
    message.value = '资料已保存。';
  } catch (err) {
    error.value = err.message || '保存失败，请稍后重试。';
  } finally {
    saving.value = false;
  }
};

const handleSignOut = async () => {
  await signOut();
  router.push('/login');
};

onMounted(async () => {
  await fetchProfile();
  await loadStats();
});
</script>

<style scoped>
.profile-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 20px;
}

.profile-summary {
  text-align: center;
}

.profile-avatar {
  width: 76px;
  height: 76px;
  display: grid;
  place-items: center;
  margin: 0 auto 14px;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  font-size: 2rem;
  font-weight: 800;
}

.profile-summary h2 {
  margin-bottom: 6px;
}

.profile-summary p {
  color: var(--text-muted);
  word-break: break-word;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 24px;
}

.stat-grid div {
  padding: 12px 8px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.stat-grid strong,
.stat-grid span {
  display: block;
}

.stat-grid span {
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 0.82rem;
}

@media (max-width: 860px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
}
</style>
