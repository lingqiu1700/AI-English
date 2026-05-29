import { ref } from 'vue';
import { supabase } from '../services/supabase.js';

export const currentUser = ref(null);
export const userProfile = ref(null);
export const authReady = ref(false);

const defaultUsername = (email = '') => email.split('@')[0]?.slice(0, 24) || 'learner';

export function useAuth() {
  const fetchProfile = async () => {
    if (!currentUser.value) {
      userProfile.value = null;
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.value.id)
      .maybeSingle();

    if (error) {
      console.error('获取用户资料失败:', error.message);
      return null;
    }

    if (data) {
      userProfile.value = data;
      return data;
    }

    return ensureProfile();
  };

  const ensureProfile = async (preferredUsername) => {
    if (!currentUser.value) return null;

    const username = (preferredUsername || currentUser.value.user_metadata?.username || defaultUsername(currentUser.value.email)).trim();
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: currentUser.value.id,
          username,
          english_level: 'A1',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      )
      .select()
      .single();

    if (error) {
      console.error('创建用户资料失败:', error.message);
      return null;
    }

    userProfile.value = data;
    return data;
  };

  const signUp = async (email, password, username) => {
    const cleanUsername = username?.trim() || defaultUsername(email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: cleanUsername },
      },
    });

    if (error) throw error;

    if (data.session?.user) {
      currentUser.value = data.session.user;
      await ensureProfile(cleanUsername);
    }

    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    currentUser.value = data.user;
    await fetchProfile();
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    currentUser.value = null;
    userProfile.value = null;
  };

  const updateProfile = async (updates) => {
    if (!currentUser.value) throw new Error('请先登录');

    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', currentUser.value.id)
      .select()
      .single();

    if (error) throw error;

    if (payload.username) {
      await supabase.auth.updateUser({ data: { username: payload.username } });
    }

    userProfile.value = data;
    return data;
  };

  const initializeAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      currentUser.value = session?.user || null;
      if (currentUser.value) await fetchProfile();

      supabase.auth.onAuthStateChange(async (_event, session) => {
        currentUser.value = session?.user || null;
        if (currentUser.value) await fetchProfile();
        else userProfile.value = null;
      });
    } catch (error) {
      console.error('初始化登录状态失败:', error.message);
      await supabase.auth.signOut();
      currentUser.value = null;
      userProfile.value = null;
    } finally {
      authReady.value = true;
    }
  };

  return { signUp, signIn, signOut, initializeAuth, fetchProfile, updateProfile, ensureProfile };
}
