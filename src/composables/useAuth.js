import {ref} from 'vue'
import {supabase} from "../services/supabase.js";

export const currentUser = ref(null)
export const userProfile = ref(null)

export function useAuth() {
    //注册
    const signUp = async (email, password) => {
        const { data, error } = await supabase.auth.signUp({email, password})
        if (error) throw error
        return data
    }

    //登录
    const signIn = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({email, password})
        if (error) throw error
        return data
    }

    //登出
    const signOut = async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
    }

    //监听登录状态  &&  调用fetchProfile获取用户资料
    const initializeAuth = async () => {
        try {
            const {data: {session}} = await supabase.auth.getSession()
            currentUser.value = session?.user || null;
            if (currentUser.value) await fetchProfile();

            supabase.auth.onAuthStateChange(async (_event, session) => {
                currentUser.value = session?.user || null;
                if (currentUser.value) await fetchProfile();
                else userProfile.value = null;
            })
        } catch (error) {
            await supabase.auth.signOut();
            currentUser.value = null;
        }
    }

    const fetchProfile = async () => {
        if (!currentUser.value) {
            return;
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.value.id)
            .single();

        if (error) {
            console.error('获取用户资料失败:', error);
        }else {
            userProfile.value = data;
        }
    };

    return {signUp, signIn, signOut, initializeAuth, fetchProfile};
}