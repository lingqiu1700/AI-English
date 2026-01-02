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

    async analyzeWord(word, dictData) {
        const prompt = `你是一个词典专家。分析单词: "${word}"。参考词典: ${JSON.stringify(dictData)}。请返回 JSON 格式：{ "chinese_meanings": ["..."], "phonetic": "...", "pos": "...", "mnemonic": "...", "examples": [{"en": "...", "cn": "..."}] }`;
        return this.callProxy({ mode: "analyze", prompt });
    },

    async analyzeSentence(sentence) {
        const prompt = `你是一个语法专家。分析句子: "${sentence}"。请返回 JSON 格式：{"trans": "...", "structure": "...", "grammar": ["..."]}`;
        return this.callProxy({ mode: "analyze", prompt });
    },

    async chatAdaptive(history, userInput) {
        // 修正点：将角色指令包含在 prompt 中发送给云函数
        const systemInstruction = `你是一个专业的英语私教。
        任务：根据历史和输入推断用户英语水平(A1-C2)并回复。回复必须符合用户水平。
        如果用户有错，请在 feedback 字段给出简短中文建议。
        必须返回纯 JSON 格式：{"reply": "英文回复内容", "detected_level": "推断等级", "feedback": "纠错建议或为空"}`;

        return this.callProxy({
            mode: "chat",
            prompt: userInput,
            history: history,
            systemInstruction: systemInstruction // 传给云函数
        });
    }
};