// netlify/functions/gemini-proxy.js
const { GoogleGenAI } = require("@google/genai");

exports.handler = async (event) => {
    // 1. 基础检查：仅允许 POST
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        // 2. 解析请求体
        const body = JSON.parse(event.body || "{}");
        const { mode, prompt, history = [], level = 'A1' } = body;

        const apiKey = process.env.VITE_AI_API_KEY;
        if (!apiKey) {
            return { statusCode: 500, body: JSON.stringify({ data: "Error: Netlify 环境变量 VITE_AI_API_KEY 缺失" }) };
        }

        // 3. 初始化 SDK
        const ai = new GoogleGenAI({ apiKey });

        // 4. 定制化等级指令
        const levelConfigs = {
            'A1': "用户是初学者(A1)。请使用最简单的英语，配合大量中文解释。例句极简。",
            'A2': "用户初级水平(A2)。解释清晰，中英结合，介绍基础短语。",
            'B1': "用户中等水平(B1)。增加英文比例，介绍地道用法和中级词汇。",
            'B2': "用户中高级水平(B2)。主要用英文解释，探讨语境差异，例句商务化。",
            'C1': "用户高级水平(C1)。完全用英文解析，强调细微差别和学术用法。",
            'C2': "用户母语级水平(C2)。进行深度的语言学解析。"
        };

        const systemInstruction = `你是一个英语私教。
        当前用户等级：${level}。教学要求：${levelConfigs[level] || levelConfigs['A1']}。
        请始终返回纯 JSON 格式：{"reply": "...", "data": "...", "feedback": "..."}`;

        // 5. 调用 Gemini
        let result;
        const generationConfig = { responseMimeType: "application/json" };
        const modelName = "gemini-2.5-flash-lite"; // 模型

        if (mode === "chat") {
            // 对话模式
            result = await ai.models.generateContent({
                model: modelName,
                systemInstruction: systemInstruction,
                contents: [
                    ...history,
                    { role: "user", parts: [{ text: prompt }] }
                ],
                generationConfig
            });
        } else {
            // 单词/句子分析模式
            result = await ai.models.generateContent({
                model: modelName,
                systemInstruction: systemInstruction,
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig
            });
        }

        // 6. 返回结果
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: result.text })
        };

    } catch (error) {
        console.error("Cloud Function Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ data: `AI 脑机连接故障: ${error.message}` })
        };
    }
};