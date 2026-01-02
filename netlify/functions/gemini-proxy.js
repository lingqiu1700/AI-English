// netlify/functions/gemini-proxy.js
const { GoogleGenAI } = require("@google/genai");

exports.handler = async (event, context) => {
    // 1. 仅允许 POST 请求
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { mode, prompt, history } = JSON.parse(event.body);

        // 2. 从环境变量获取 Key (Netlify 控制台设置)
        const genAI = new GoogleGenAI({ apiKey: process.env.VITE_AI_API_KEY });
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        let responseText = "";

        // 3. 根据模式处理请求
        if (mode === "chat") {
            // 对话模式：使用 history
            const result = await model.generateContent({
                contents: [...history, { role: "user", parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            });
            responseText = result.response.text();
        } else {
            // 单词/句子分析模式
            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            });
            responseText = result.response.text();
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: responseText })
        };
    } catch (error) {
        console.error("Proxy Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to fetch from Gemini" })
        };
    }
};