// src/services/ai.js

export const AiService = {
    // 核心逻辑：带重试机制的请求
    async callProxy(payload, useFallback = true) {
        const currentProvider = payload.provider || localStorage.getItem('ai_provider') || 'gemini';

        try {
            const res = await fetch("/.netlify/functions/ai-proxy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...payload, provider: currentProvider })
            });

            // 如果 Gemini 报错 (503/500/429) 且允许重试
            if (!res.ok && currentProvider === 'gemini' && useFallback) {
                console.warn("Gemini 暂时不可用，正在切换至通义千问...");
                return this.callProxy({ ...payload, provider: 'qwen' }, false);
            }

            if (!res.ok) throw new Error("AI 服务请求失败");

            const result = await res.json();
            let cleanText = result.data.replace(/```json\n?|```/g, "").trim();
            let parsed = JSON.parse(cleanText);

            // 关键：如果 parsed 内部还有一个 data 字符串（如千问有时会这么做）
            if (typeof parsed.data === 'string' && parsed.data.startsWith('{')) {
                try {
                    const nestedData = JSON.parse(parsed.data.replace(/'/g, '"')); // 处理单引号问题
                    parsed = { ...parsed, ...nestedData };
                } catch (e) {
                    console.warn("二次解析嵌套数据失败");
                }
            }

            return parsed;

        } catch (error) {
            // 如果 Qwen 也挂了，才彻底报错
            if (currentProvider === 'qwen') throw error;
            // 否则尝试用 Qwen 救场
            return this.callProxy({ ...payload, provider: 'qwen' }, false);
        }
    },

    // 以下方法保持接口不变，内部逻辑自动享受自动切换
    async analyzeWord(word, dictData, level = 'A1') {
        return this.callProxy({ mode: "analyze", prompt: `分析单词: ${word}`, level });
    },

    async analyzeSentence(sentence, level = 'A1') {
        return this.callProxy({ mode: "analyze", prompt: `分析句子: ${sentence}`, level });
    },

    async chatAdaptive(history, userInput, level = 'A1') {
        return this.callProxy({ mode: "chat", prompt: userInput, history, level });
    }
};