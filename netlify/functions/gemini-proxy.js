// netlify/functions/gemini-proxy.js
const { GoogleGenAI } = require("@google/genai");

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    try {
        const { mode, prompt, history, systemInstruction } = JSON.parse(event.body);
        const apiKey = process.env.VITE_AI_API_KEY;

        if (!apiKey) {
            return { statusCode: 500, body: JSON.stringify({ data: "Error: API Key 缺失。请在 Netlify 后台配置 VITE_AI_API_KEY。" }) };
        }

        const ai = new GoogleGenAI({ apiKey });

        let result;
        if (mode === "chat") {
            result = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                systemInstruction: systemInstruction, // 设置系统指令
                contents: [
                    ...history,
                    { role: "user", parts: [{ text: prompt }] }
                ],
                generationConfig: { responseMimeType: "application/json" }
            });
        } else {
            result = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            });
        }

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