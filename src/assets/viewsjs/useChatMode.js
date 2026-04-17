import { ref, watch, nextTick } from 'vue';
import { AiService } from '../../services/ai.js';
import { supabase } from '../../services/supabase.js';
import { userProfile, currentUser } from '../../composables/useAuth.js';
import { useChatSession, currentSessionId } from "./useChatSession.js";

export function useChatMode() {
    const input = ref('');
    const isLoading = ref(false);
    const chatBox = ref(null);
    const chatHistory = ref([]);
    const { createSession } = useChatSession();

    const scrollToBottom = async () => {
        await nextTick();
        if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight;
    };

    // 1. 监听会话切换
    const loadSessionMessages = async (sid) => {
        if (!sid) {
            chatHistory.value = [{ id: 'init', role: 'assistant', content: "Hello! I'm your tutor. Let's practice English!", type: 'text' }];
            return;
        }
        const { data } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('session_id', sid)
            .order('created_at', { ascending: true });

        if (data) {
            chatHistory.value = data.map(m => ({
                ...m,
                content: m.content.text || m.content.reply || m.content,
                feedback: m.content.feedback || ''
            }));
            await scrollToBottom();
        }
    };

    watch(currentSessionId, (newId) => loadSessionMessages(newId), { immediate: true });

    const onSend = async () => {
        if (!input.value.trim() || isLoading.value) return;

        const text = input.value.trim();
        const currentLevel = userProfile.value?.english_level || 'A1';

        // UI 先行
        chatHistory.value.push({ id: Date.now(), role: 'user', content: text, type: 'text' });
        isLoading.value = true;
        input.value = '';
        await scrollToBottom();

        try {
            // 2. 创建会话（如果需要）
            if (!currentSessionId.value) {
                await createSession('chat', text);
            }

            // 3. 存入用户消息
            await supabase.from('chat_messages').insert({
                session_id: currentSessionId.value,
                role: 'user',
                content: { text: text },
                type: 'text'
            });

            // 4. 获取 AI 响应
            const historyForAi = chatHistory.value.slice(-6).map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content || '' }]
            }));

            const result = await AiService.chatAdaptive(historyForAi, text, currentLevel);

            // 5. 等级自动调整逻辑
            if (result.detected_level && result.detected_level !== currentLevel) {
                await supabase.from('profiles').update({ english_level: result.detected_level }).eq('id', currentUser.value.id);
                userProfile.value.english_level = result.detected_level;
            }

            // 6. 存入 AI 消息（包含反馈和回复）
            const { data: aiMsg, error } = await supabase.from('chat_messages').insert({
                session_id: currentSessionId.value,
                role: 'assistant',
                content: { reply: result.reply, feedback: result.feedback, detected_level: result.detected_level },
                type: 'chat'
            }).select().single();

            if (error) throw error;

            chatHistory.value.push({
                ...aiMsg,
                content: result.reply,
                feedback: result.feedback
            });

        } catch (e) {
            console.error("Chat Persistence Error:", e);
        } finally {
            isLoading.value = false;
            await scrollToBottom();
        }
    };

    return { input, isLoading, chatHistory, chatBox, onSend };
}