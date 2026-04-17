import { ref, onMounted, watch } from 'vue';
import { AiService } from '/src/services/ai.js';
import { supabase } from '/src/services/supabase.js';
import { currentUser, userProfile } from '/src/composables/useAuth';
// 💡 确保路径正确指向你的全局会话管理器
import { useChatSession, currentSessionId } from "./useChatSession.js";

export function useWordMode() {
    const input = ref('');
    const isLoading = ref(false);
    const collections = ref([]);
    const chatHistory = ref([]);
    const { createSession } = useChatSession();

    // 加载具体会话的消息记录
    const loadSessionMessages = async (sid) => {
        if (!sid) {
            chatHistory.value = [{ id: 'init', role: 'assistant', content: '请输入你想学习的单词。', type: 'text' }];
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
            console.error("加载消息失败:", err);
        }
    };

    watch(currentSessionId, (newId) => loadSessionMessages(newId), { immediate: true });

    // 权威词典 API
    async function fetchStandardDict(word) {
        try {
            const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            if (!res.ok) return null;
            const data = await res.json();
            return {
                phonetic: data[0].phonetic,
                pos: data[0].meanings[0].partOfSpeech,
                baseDef: data[0].meanings[0].definitions[0].definition
            };
        } catch (e) { return null; }
    }

    const onSend = async () => {
        if (!input.value.trim() || isLoading.value) return;

        const word = input.value.trim();
        isLoading.value = true;
        input.value = '';

        // --- 优化：本地先行渲染，提升反应速度 ---
        const tempUserMsgId = Date.now();
        chatHistory.value.push({ id: tempUserMsgId, role: 'user', content: word, type: 'text' });

        try {
            // 1. 检查并创建会话
            if (!currentSessionId.value) {
                const newSid = await createSession('word', word);
                if (!newSid) throw new Error("无法创建会话");
            }

            // 2. 异步将用户消息存入数据库（不阻塞 UI）
            supabase.from('chat_messages').insert({
                session_id: currentSessionId.value,
                role: 'user',
                content: { text: word },
                type: 'text'
            }).then();

            // 3. 调用 AI 解析
            const dictData = await fetchStandardDict(word);
            const aiResult = await AiService.analyzeWord(word, dictData, userProfile.value?.english_level || 'A1');

            const cardData = {
                word: word,
                phonetic: dictData?.phonetic || aiResult.phonetic || '',
                pos: dictData?.pos || aiResult.pos || '',
                definitions: aiResult.chinese_meanings || [aiResult.reply || "解析中..."],
                mnemonic: aiResult.mnemonic || "正在生成助记...",
                examples: aiResult.examples || []
            };

            // 4. 将 AI 消息存入数据库
            const { data: aiMsg, error: dbError } = await supabase.from('chat_messages').insert({
                session_id: currentSessionId.value,
                role: 'assistant',
                content: cardData, // 存入卡片 JSON 对象
                type: 'card'
            }).select().single();

            if (dbError) throw dbError;

            // 5. 更新本地列表
            chatHistory.value.push({
                ...aiMsg,
                type: 'card',
                data: cardData,
                content: '' // 单词卡片不需要显示文本内容，模板会渲染 msg.data
            });

        } catch (e) {
            console.error("发送失败详情:", e);
            chatHistory.value.push({
                id: Date.now(),
                role: 'assistant',
                content: `抱歉，处理 "${word}" 时出错了：${e.message}`,
                type: 'text'
            });
        } finally {
            isLoading.value = false;
        }
    };

    // 收藏逻辑
    const isCollected = (word) => collections.value.some(item => item.word === word);
    const toggleCollect = async (wordData) => {
        if (!currentUser.value) return;
        const existing = collections.value.find(item => item.word === wordData.word);
        if (existing) {
            await supabase.from('word_collections').delete().eq('id', existing.id);
            collections.value = collections.value.filter(item => item.id !== existing.id);
        } else {
            const { data } = await supabase.from('word_collections').insert({
                user_id: currentUser.value.id,
                word: wordData.word,
                phonetic: wordData.phonetic,
                translation: wordData.definitions
            }).select().single();
            if (data) collections.value.push(data);
        }
    };

    onMounted(async () => {
        if (currentUser.value) {
            const { data } = await supabase.from('word_collections').select('*');
            if (data) collections.value = data;
        }
    });

    return { input, isLoading, chatHistory, onSend, isCollected, toggleCollect };
}