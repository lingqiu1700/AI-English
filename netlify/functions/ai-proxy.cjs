// [cite: 1] netlify/functions/ai-proxy.cjs
const { GoogleGenAI } = require("@google/genai");

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    try {
        const body = JSON.parse(event.body || "{}"); // [cite: 2]
        const { mode, prompt, history = [], level = 'A1', provider = 'gemini' } = body; // [cite: 3]

        const levelConfigs = {
            'A1': "初学者(A1)。极简英语+大量中文解释。",
            'A2': "初级(A2)。清晰解释，中英结合。",
            'B1': "中级(B1)。多用英文，介绍地道短语。",
            'B2': "中高级(B2)。全英为主，探讨语境差异。",
            'C1': "高级(C1)。学术/文学深度解析。",
            'C2': "专家(C2)。母语级语言学探讨。"
        }; // [cite: 4, 5]

        const analyzeInstruction = `你是一个英语专家。针对单词分析，必须严格返回以下 JSON 格式：
            {
                "chinese_meanings": ["意思1", "意思2"],
                "mnemonic": "助记方法",
                "examples": [{"en": "sentence", "cn": "翻译"}]
            }`;

        const chatInstruction = `你是一个英语私教。当前用户等级：${level}。
            要求：
                1. 根据用户表现，在 JSON 中给出 detected_level (A1-C2)。
                2. 返回格式严格遵循：
            {
                "reply": "你的回复内容",
                "feedback": "纠错建议 (如有)",
                "detected_level": "检测到的等级"
            }`; //

        const systemPrompt = mode === 'analyze' ? analyzeInstruction : chatInstruction; // [cite: 8, 9]

        if (provider === 'qwen') {
            const response = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.VITE_QWEN_API_KEY}`, //
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "qwen3.5-flash",
                    messages: [
                        { role: "system", content: systemPrompt },
                        ...history.map(h => ({
                            role: h.role === 'model' ? 'assistant' : 'user',
                            content: h.parts[0].text
                        })), // [cite: 11, 12]
                        { role: "user", content: prompt } // [cite: 13]
                    ],
                    response_format: { type: "json_object" }
                })
            });
            const resData = await response.json(); // [cite: 14]
            if (!response.ok) throw new Error(`Qwen Error: ${resData.error?.message || 'Unknown'}`);
            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: resData.choices[0].message.content })
            }; // [cite: 15]
        } else {
            // 修复：初始化 SDK 直接传入字符串，不使用对象
            const genAI = new GoogleGenAI(process.env.VITE_AI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

            const contents = mode === 'chat'
                ? [...history, { role: "user", parts: [{ text: prompt }] }] // [cite: 18]
                : [{ role: "user", parts: [{ text: prompt }] }];

            const result = await model.generateContent({
                contents,
                systemInstruction: systemPrompt,
                generationConfig: { responseMimeType: "application/json" }
            }); // [cite: 19]

            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: result.response.text() })
            }; // [cite: 20]
        }
    } catch (error) {
        console.error("Proxy Error:", error); // [cite: 21]
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        }; // [cite: 22, 23]
    }
};