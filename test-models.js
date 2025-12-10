const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = "AIzaSyBDCtd9CazvqlKdk0rB7U4213ldXEdnYBU";
const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        // There isn't a direct listModels method on the instance easily accessible in all versions, 
        // but we can try to generate content to test "gemini-1.5-flash" directly.

        console.log("Testing gemini-1.5-flash...");
        const result = await model.generateContent("Hello");
        const response = await result.response;
        console.log("Success with gemini-1.5-flash:", response.text());
    } catch (error) {
        console.error("Error with gemini-1.5-flash:", error.message);
    }

    try {
        const modelPro = genAI.getGenerativeModel({ model: "gemini-pro" });
        console.log("Testing gemini-pro...");
        const resultPro = await modelPro.generateContent("Hello");
        const responsePro = await resultPro.response;
        console.log("Success with gemini-pro:", responsePro.text());
    } catch (error) {
        console.error("Error with gemini-pro:", error.message);
    }
}

listModels();
