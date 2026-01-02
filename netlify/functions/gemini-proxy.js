// netlify/functions/gemini-proxy.js
const { GoogleGenAI } = require("@google/genai");

exports.handler = async (event) => {
    // 仅允许 POST 请求
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { mode, prompt, history } = JSON.parse(event.body);

        // 1. 初始化客户端
        const ai = new GoogleGenAI({
            apiKey: process.env.VITE_AI_API_KEY
        });

        let result;

        // 2. 使用新版 SDK 语法：ai.models.generateContent
        if (mode === "chat") {
            // 对话模式
            result = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [
                    ...history,
                    { role: "user", parts: [{ text: prompt }] }
                ],
                generationConfig: { responseMimeType: "application/json" }
            });
        } else {
            // 单词/句子分析模式
            result = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            });
        }

        // 3. 注意：新版 SDK 返回的内容直接在 text 属性中，或者通过 text 属性访问
        // 根据你提供的快速入门文档，应使用 response.text
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: result.text })
        };

    } catch (error) {
        console.error("Cloud Function Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.message,
                stack: error.stack
            })
        };
    }
};