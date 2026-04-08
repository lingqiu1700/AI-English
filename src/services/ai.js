// src/services/ai.js

export const AiService = {

    async callProxy(payload) {
        const res = await fetch("/.netlify/functions/gemini-proxy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("服务器代理请求失败");

        const result = await res.json();
        // 关键：这里需要处理可能的 Markdown 包裹
        const cleanJsonText = result.data.replace(/```json|```/g, "").trim();
        return JSON.parse(cleanJsonText);
    },

    // 增加 level 参数
    async analyzeWord(word, dictData, level = 'A1') {
        const prompt = `分析单词: "${word}"。参考数据: ${JSON.stringify(dictData)}。`;
        return this.callProxy({
            mode: "analyze",
            prompt,
            level // 将等级传给后端
        });
    },

    // src/services/ai.js
    async analyzeSentence(sentence, level = 'A1') {
        const prompt = `请分析句子: "${sentence}"。
    要求：返回 JSON 格式，包含 trans (中文翻译), structure (结构说明), grammar (语法点列表)。`;
        return this.callProxy({ mode: "analyze", prompt, level });
    },

    async chatAdaptive(history, userInput, level = 'A1') {
        return this.callProxy({
            mode: "chat",
            prompt: userInput,
            history: history,
            level
        });
    }
};