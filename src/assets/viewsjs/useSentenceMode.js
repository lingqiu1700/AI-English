import { ref, watch } from 'vue';
import { AiService } from '../../services/ai.js';
import { supabase } from '../../services/supabase.js';
import { userProfile, currentUser } from '../../composables/useAuth.js';
import { useChatSession, currentSessionId } from "./useChatSession.js";

export function useSentenceMode() {
    const input = ref('');
    const isLoading = ref(false);
    const chatHistory = ref([]);
    const { createSession } = useChatSession();

    // 1. 监听侧边栏会话切换，加载历史消息
    const loadSessionMessages = async (sid) => {
        if (!sid) {
            chatHistory.value = [{ id: 'init', role: 'assistant', content: '你好！发给我一个长句子，我会为你拆解它的语法。', type: 'text' }];
            return;
        }
        try {
            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('session_id', sid)
                .order('created_at', { ascending: true });

            if (error) throw error;
            if (data) chatHistory.value = data.map(m => ({
                ...m,
                content: m.role === 'user' ? (m.content.text || m.content) : m.content.text || m.content,
                data: m.content
            }));
        } catch (err) {
            console.error("加载句子分析历史失败:", err);
        }
    };

    watch(currentSessionId, (newId) => loadSessionMessages(newId), { immediate: true });

    const onSend = async () => {
        if (!input.value.trim() || isLoading.value) return;

        const sentence = input.value.trim();
        isLoading.value = true;
        input.value = '';

        // UI 先行渲染用户输入
        chatHistory.value.push({ id: Date.now(), role: 'user', content: sentence, type: 'text' });

        try {
            // 2. 检查并创建新会话
            if (!currentSessionId.value) {
                const newSid = await createSession('sentence', sentence);
                if (!newSid) throw new Error("无法创建句子分析会话");
            }

            // 3. 将用户消息存入数据库
            await supabase.from('chat_messages').insert({
                session_id: currentSessionId.value,
                role: 'user',
                content: { text: sentence },
                type: 'text'
            });

            // 4. 调用 AI 进行句子分析
            const currentLevel = userProfile.value?.english_level || 'A1';
            const result = await AiService.analyzeSentence(sentence, currentLevel);

            const analysisData = {
                trans: result.trans || result.reply || "解析内容生成中...",
                structure: result.structure || "结构分析生成中...",
                grammar: result.grammar || [],
                private_note: result.private_note || ""
            };

            // 5. 将 AI 分析结果存入数据库
            const { data: aiMsg, error: dbError } = await supabase.from('chat_messages').insert({
                session_id: currentSessionId.value,
                role: 'assistant',
                content: analysisData,
                type: 'analysis'
            }).select().single();

            if (dbError) throw dbError;

            // 6. 更新本地 UI
            chatHistory.value.push({
                ...aiMsg,
                type: 'analysis',
                data: analysisData
            });

        } catch (e) {
            console.error("Sentence Analysis Error:", e);
            chatHistory.value.push({
                id: Date.now() + 2,
                role: 'assistant',
                content: `分析失败：${e.message}`,
                type: 'text'
            });
        } finally {
            isLoading.value = false;
        }
    };

    return { input, isLoading, chatHistory, onSend };
}