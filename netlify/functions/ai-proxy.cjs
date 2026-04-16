const { GoogleGenAI } = require("@google/genai");

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    try {
        const body = JSON.parse(event.body || "{}");
        const { mode, prompt, history = [], level = 'A1', provider = 'gemini' } = body;

        // 针对不同模式的指令 [cite: 5, 7, 9]
        const wordInstruction = `针对单词分析，必须严格返回以下 JSON：{"chinese_meanings": ["..."], "mnemonic": "...", "examples": [{"en": "...", "cn": "..."}]}`;

        const sentenceInstruction = `你是一个语法专家。针对句子分析，必须严格返回以下 JSON：{"trans": "中文翻译", "structure": "句子成分拆解", "grammar": ["知识点1", "知识点2"], "private_note": "进阶提示"}`;

        const chatInstruction = `你是一个英语私教。等级：${level}。返回 JSON：{"reply": "...", "feedback": "...", "detected_level": "..."}`;

        let systemPrompt = chatInstruction;
        if (mode === 'word') systemPrompt = wordInstruction;
        if (mode === 'sentence') systemPrompt = sentenceInstruction;

        if (provider === 'qwen') {
            const response = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.VITE_QWEN_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "qwen3.5-flash",
                    messages: [{ role: "system", content: systemPrompt }, ...history.map(h => ({ role: h.role === 'model' ? 'assistant' : 'user', content: h.parts[0].text })), { role: "user", content: prompt }],
                    response_format: { type: "json_object" }
                })
            });
            const resData = await response.json();
            return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: resData.choices[0].message.content }) };
        } else {
            const genAI = new GoogleGenAI(process.env.VITE_AI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

            const contents = mode === 'chat' ? [...history, { role: "user", parts: [{ text: prompt }] }] : [{ role: "user", parts: [{ text: prompt }] }];
            const result = await model.generateContent({ contents, systemInstruction: systemPrompt, generationConfig: { responseMimeType: "application/json" } });
            return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: result.response.text() }) };
        }
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};