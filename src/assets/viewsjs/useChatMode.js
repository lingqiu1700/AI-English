import { ref, nextTick } from 'vue';
import { AiService } from '../../services/ai.js';
import { supabase } from '../../services/supabase.js';
import { userProfile, currentUser } from '../../composables/useAuth.js';

export function useChatMode() {
    const input = ref('');
    const isLoading = ref(false);
    const chatBox = ref(null);
    const chatHistory = ref([
        {
            id: 1,
            role: 'assistant',
            content: "Hello! I'm your AI tutor. Let's practice English. How can I help you today?",
            feedback: ''
        }
    ]);

    // 1. 打字机伪装逻辑
    const typeWriter = (text, messageObj, speed = 25) => {
        return new Promise((resolve) => {
            let i = 0;
            messageObj.content = ""; // 先清空占位内容
            const timer = setInterval(() => {
                messageObj.content += text.charAt(i);
                i++;
                if (i >= text.length) {
                    clearInterval(timer);
                    resolve();
                }
                scrollToBottom(); // 随打字过程实时滚动
            }, speed);
        });
    };

    // 2. 自动滚动逻辑
    const scrollToBottom = async () => {
        await nextTick();
        if (chatBox.value) {
            chatBox.value.scrollTop = chatBox.value.scrollHeight;
        }
    };

    // 3. 核心发送逻辑
    const onSend = async () => {
        // 防止请求堆积：如果正在加载，禁止再次发送
        if (!input.value.trim() || isLoading.value) return;

        const text = input.value;
        const currentLevel = userProfile.value?.english_level || 'A1';

        // UI 反馈：用户消息上屏
        chatHistory.value.push({
            id: Date.now(),
            role: 'user',
            content: text
        });

        isLoading.value = true;
        input.value = '';
        await scrollToBottom();

        // 构造上下文
        const historyForAi = chatHistory.value.slice(-6).map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));

        // 防止超时：设置 25 秒强制断开控制器 (Netlify 免费版上限通常为 26s)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        try {
            const result = await AiService.chatAdaptive(historyForAi, text, currentLevel, controller.signal);
            clearTimeout(timeoutId);

            // A. 等级进化逻辑 (Day 3 核心)
            if (result.detected_level && result.detected_level !== currentLevel) {
                const { error } = await supabase
                    .from('profiles')
                    .update({ english_level: result.detected_level })
                    .eq('id', currentUser.value.id);

                if (!error) {
                    userProfile.value.english_level = result.detected_level;
                }
            }

            // B. 流式 UI 伪装：先创建一个空的助手消息对象
            const aiMsg = {
                id: Date.now() + 1,
                role: 'assistant',
                content: "...", // 初始占位符
                feedback: result.feedback || ''
            };
            chatHistory.value.push(aiMsg);

            // C. 执行打字机动画
            await typeWriter(result.reply, aiMsg);

        } catch (e) {
            console.error("Chat Error:", e);

            let errorTip = "抱歉，我的网络连接似乎断开了。";
            if (e.name === 'AbortError') {
                errorTip = "抱歉，分析长句子耗时过长，请尝试稍微简短一些。";
            }

            chatHistory.value.push({
                id: Date.now() + 2,
                role: 'assistant',
                content: errorTip,
                feedback: ''
            });
        } finally {
            isLoading.value = false;
            await scrollToBottom();
        }
    };

    return {
        input,
        isLoading,
        chatHistory,
        chatBox,
        onSend
    };
}