import { ref, nextTick } from 'vue';
import { AiService } from '/src/services/ai.js';
import { supabase } from '/src/services/supabase.js';
import { currentUser, userProfile } from '/src/composables/useAuth';

export function useChatMode() {
    const input = ref('');
    const isLoading = ref(false);
    const chatBox = ref(null);
    const chatHistory = ref([
        { id: 1, role: 'assistant', content: "Hello! I'm your tutor. Let's practice English!", feedback: '' }
    ]);

    const scrollToBottom = async () => {
        await nextTick();
        if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight;
    };

    const onSend = async () => {
        if (!input.value.trim() || isLoading.value) return;

        const text = input.value;
        const currentLevel = userProfile.value?.english_level || 'A1';

        // 记录历史
        const historyForAi = chatHistory.value.slice(-5).map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));

        chatHistory.value.push({ id: Date.now(), role: 'user', content: text });
        isLoading.value = true;
        input.value = '';
        await scrollToBottom();

        try {
            const result = await AiService.chatAdaptive(historyForAi, text, currentLevel);

            // --- 核心：等级进化逻辑 ---
            if (result.detected_level && result.detected_level !== currentLevel) {
                console.log(`等级变动检测: ${currentLevel} -> ${result.detected_level}`);

                // 更新数据库
                const { error } = await supabase
                    .from('profiles')
                    .update({ english_level: result.detected_level })
                    .eq('id', currentUser.value.id);

                if (!error) {
                    userProfile.value.english_level = result.detected_level;
                    // 这里可以触发一个全局提示，比如：恭喜升级！
                }
            }

            chatHistory.value.push({
                id: Date.now() + 1,
                role: 'assistant',
                content: result.reply,
                feedback: result.feedback
            });
        } catch (e) {
            console.error("Chat Error:", e);
        } finally {
            isLoading.value = false;
            await scrollToBottom();
        }
    };

    return { input, isLoading, chatHistory, chatBox, onSend };
}