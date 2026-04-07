// netlify/functions/gemini-proxy.js
const { GoogleGenAI } = require("@google/genai");

exports.handler = async (event) => {

    const { mode, prompt, history, level = 'A1' } = JSON.parse(event.body);

    // 核心逻辑：根据等级定制 System Instruction
    const levelConfigs = {
        'A1': "用户是初学者。请使用最简单的英语，大量使用中文解释。例句要短，避开复杂语法。",
        'A2': "用户有一定基础。解释力求清晰，中英结合。介绍基础搭配。",
        'B1': "用户中等水平。增加英文解释比例，介绍地道用法和短语，例句中包含 1-2 个进阶词汇。",
        'B2': "用户水平较好。主要使用英文解释，探讨词汇的语境差异和正式度，例句要符合商务或学术场景。",
        'C1': "用户专业水平。完全使用英文解析，重点在于细微差别（Nuance）、词源和高阶文学/专业用法。",
        'C2': "用户母语级水平。进行深度的语言学或专业领域探讨，挑战其词汇边界。"
    };

    const baseInstruction = `你是一个英语私教。
    当前用户等级：${level}。要求：${levelConfigs[level]}。
    始终返回 JSON 格式：{ "reply/data": "...", ... }`;


    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    try {
        const { mode, prompt, history, level = 'A1' } = JSON.parse(event.body);
        const apiKey = process.env.VITE_AI_API_KEY;

        if (!apiKey) {
            return { statusCode: 500, body: JSON.stringify({ data: "Error: API Key 缺失。请在 Netlify 后台配置 VITE_AI_API_KEY。" }) };
        }

        const ai = new GoogleGenAI({ apiKey });

        let result;
        if (mode === "chat") {
            result = await model.generateContent({
                contents: [...history, { role: "user", parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            });
        } else {
            // 修正点：非对话模式也必须带上 generationConfig，否则不会返回 JSON
            result = await model.generateContent({
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