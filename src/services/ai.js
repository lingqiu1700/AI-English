// src/services/ai.js

export const AiService = {
    /**
     * 通用请求中转：负责将请求发送到 Netlify 云函数
     */
    async callProxy(payload) {
        // 请求我们自己定义的云函数路径
        const res = await fetch("/.netlify/functions/gemini-proxy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("服务器代理请求失败，请检查部署状态");

        const result = await res.json();

        // 清理 AI 返回内容中可能包裹的 Markdown 标签 (```json ... ```)
        const cleanJsonText = result.data.replace(/```json|```/g, "").trim();
        return JSON.parse(cleanJsonText);
    },

    /**
     * 单词分析：调用代理
     */
    async analyzeWord(word, dictData) {
        const prompt = `分析单词: "${word}"。参考数据: ${JSON.stringify(dictData)}。请返回 JSON 格式：{ "chinese_meanings": ["..."], "phonetic": "...", "pos": "...", "mnemonic": "...", "examples": [{"en": "...", "cn": "..."}] }`;

        // mode 设置为 analyze，云函数会据此处理
        return this.callProxy({ mode: "analyze", prompt });
    },

    /**
     * 句子分析：调用代理
     */
    async analyzeSentence(sentence) {
        const prompt = `分析句子: "${sentence}"。请返回 JSON 格式：{"trans": "...", "structure": "...", "grammar": ["..."]}`;

        return this.callProxy({ mode: "analyze", prompt });
    },

    /**
     * 自适应对话：调用代理
     */
    // src/services/ai.js 部分代码
    async chatAdaptive(history, userInput) {
        // history 这里已经是 [{role: '...', parts: [...]}] 格式了，无需再次 map
        const prompt = `你是一个英语私教。根据输入推断水平(A1-C2)并回复。返回 JSON: {"reply": "...", "detected_level": "...", "feedback": "纠错建议"}`;

        return this.callProxy({
            mode: "chat",
            prompt: userInput,
            history: history // 直接透传过去
        });
    }
};