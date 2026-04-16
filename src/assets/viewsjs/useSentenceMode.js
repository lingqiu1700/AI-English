import { ref } from 'vue';
import { AiService } from '../../services/ai.js';
import { userProfile } from '../../composables/useAuth';

export function useSentenceMode() {
    const input = ref('');
    const isLoading = ref(false);
    const chatHistory = ref([
        { id: 1, role: 'assistant', content: '你好！发给我一个长句子，我会为你拆解它的语法。' }
    ]);

    const onSend = async () => {
        if (!input.value.trim() || isLoading.value) return;

        const sentence = input.value;
        chatHistory.value.push({ id: Date.now(), role: 'user', content: sentence });

        isLoading.value = true;
        input.value = '';

        try {
            // 调用 AiService 进行针对句子的分析
            const currentLevel = userProfile.value?.english_level || 'A1';
            const result = await AiService.analyzeSentence(sentence, currentLevel);

            chatHistory.value.push({
                id: Date.now() + 1,
                role: 'assistant',
                type: 'analysis',
                data: {
                    trans: result.trans || result.reply || "解析内容未就绪",
                    structure: result.structure || "结构分析生成中...",
                    grammar: result.grammar || (result.feedback ? [result.feedback] : []),
                    private_note: result.private_note || ""
                }
            })
        } catch (e) {
            console.error("Sentence Analysis Error:", e);
            chatHistory.value.push({
                id: Date.now() + 2,
                role: 'assistant',
                content: '分析失败，请检查网络或 API Key 状态。'
            });
        } finally {
            isLoading.value = false;
        }
    };

    return { input, isLoading, chatHistory, onSend };
}