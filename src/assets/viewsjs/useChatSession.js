import { ref } from 'vue';
import { supabase } from '../../services/supabase.js';
import { currentUser } from '../../composables/useAuth.js';

export const sessions = ref([]);
export const currentSessionId = ref(null);

export function useChatSession() {
    const fetchSessions = async () => {
        if (!currentUser.value) return;
        const { data, error } = await supabase
            .from('chat_sessions')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) console.error("获取会话列表失败:", error.message);
        if (data) sessions.value = data;
    };

    const generateTitle = (mode, content) => {
        const now = new Date();
        const dateStr = `${now.getMonth() + 1}/${now.getDate()}`;
        let preview = mode === 'word' ? content.trim() : content.split(' ').slice(0, 5).join(' ');
        if (preview.length > 15) preview = preview.slice(0, 15) + '...';
        return `${dateStr} - ${preview}`;
    };

    const createSession = async (mode, firstContent) => {
        // 关键：检查用户登录状态
        if (!currentUser.value) {
            console.error("未检测到登录用户");
            return null;
        }

        const title = generateTitle(mode, firstContent);

        try {
            const { data, error } = await supabase.from('chat_sessions').insert({
                user_id: currentUser.value.id,
                title: title,
                mode: mode
            }).select().single();

            if (error) throw error;

            if (data) {
                sessions.value.unshift(data);
                currentSessionId.value = data.id;
                return data.id;
            }
        } catch (err) {
            console.error("Supabase 写入失败 (403通常由RLS引起):", err.message);
            return null;
        }
        return null;
    };

    return { sessions, currentSessionId, fetchSessions, createSession };
}