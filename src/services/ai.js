import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_AI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

export const AiService = {
    // 单词分析
    async analyzeWord(word, dictData) {
        const prompt = `分析单词: "${word}"。请返回 JSON 格式：{ "chinese_meanings": ["..."], "phonetic": "...", "pos": "...", "mnemonic": "...", "examples": [{"en": "...", "cn": "..."}] }`;
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            });
            return JSON.parse(response.text.replace(/```json|```/g, "").trim());
        } catch (error) {
            console.error("单词分析失败:", error);
            throw error;
        }
    },

    // 句子分析
    async analyzeSentence(sentence) {
        const prompt = `分析句子: "${sentence}"。请返回 JSON 格式：{"trans": "...", "structure": "...", "grammar": ["..."]}`;
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            });
            return JSON.parse(response.text.replace(/```json|```/g, "").trim());
        } catch (error) {
            console.error("句子分析失败:", error);
            throw error;
        }
    },

    // 自适应对话 (已并入 AiService 并修正语法)
    async chatAdaptive(history, userInput) {
        const prompt = `
            你是一个英语私教。请根据对话历史推断用户水平并回复。
            历史: ${JSON.stringify(history)} 
            输入: "${userInput}"
            要求返回 JSON: {"reply": "你的回复", "detected_level": "水平", "feedback": "纠错建议或为空"}
        `;
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            });
            return JSON.parse(response.text.replace(/```json|```/g, "").trim());
        } catch (error) {
            console.error("对话失败:", error);
            throw error;
        }
    }
};