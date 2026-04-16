import { ref, onMounted } from 'vue';
import { AiService } from '/src/services/ai.js';
import { supabase } from '/src/services/supabase.js';
import { currentUser, userProfile } from '/src/composables/useAuth';

export function useWordMode() {
    const input = ref('');
    const isLoading = ref(false);
    const collections = ref([]);
    const chatHistory = ref([
        { id: 1, role: 'assistant', content: '请输入你想学习的单词。', type: 'text' }
    ]);

    // 1. 权威词典 API 调用
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
        } catch (e) {
            return null;
        }
    }

    // 2. 发送分析请求
    const onSend = async () => {
        if (!input.value.trim() || isLoading.value) return;

        const word = input.value;
        chatHistory.value.push({ id: Date.now(), role: 'user', content: word, type: 'text' });

        isLoading.value = true;
        input.value = '';

        try {
            const dictData = await fetchStandardDict(word);
            const currentLevel = userProfile.value?.english_level || 'A1';
            const aiResult = await AiService.analyzeWord(word, dictData, currentLevel);

            chatHistory.value.push({
                id: Date.now() + 1,
                role: 'assistant',
                type: 'card',
                data: {
                    word: word,
                    phonetic: dictData?.phonetic || aiResult.phonetic,
                    pos: dictData?.pos || aiResult.pos,
                    definitions: aiResult.chinese_meanings || (aiResult.reply ? [aiResult.reply] : ["解析结果格式不符"]),
                    mnemonic: aiResult.mnemonic || aiResult.data || "暂无助记",
                    examples: aiResult.examples || []
                }
            });
        } catch (e) {
            console.error("Analysis Error:", e);
            chatHistory.value.push({
                id: Date.now() + 2,
                role: 'assistant',
                content: '抱歉，AI 解析失败，请检查网络或配置。',
                type: 'text'
            });
        } finally {
            isLoading.value = false;
        }
    };

    // 3. 收藏逻辑 (Day 2 核心)
    const isCollected = (word) => collections.value.some(item => item.word === word);

    const toggleCollect = async (wordData) => {
        if (!currentUser.value) return alert('请先登录后收藏');

        const existing = collections.value.find(item => item.word === wordData.word);

        if (existing) {
            // 取消收藏
            const { error } = await supabase.from('word_collections').delete().eq('id', existing.id);
            if (!error) collections.value = collections.value.filter(item => item.word !== wordData.word);
        } else {
            // 添加收藏
            const { data, error } = await supabase.from('word_collections').insert({
                user_id: currentUser.value.id,
                word: wordData.word,
                phonetic: wordData.phonetic,
                translation: wordData.definitions
            }).select().single();

            if (!error) collections.value.push(data);
        }
    };

    // 4. 初始化加载收藏夹
    onMounted(async () => {
        if (currentUser.value) {
            const { data } = await supabase.from('word_collections').select('*');
            if (data) collections.value = data;
        }
    });

    return {
        input,
        isLoading,
        chatHistory,
        onSend,
        isCollected,
        toggleCollect
    };
}