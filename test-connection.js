const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = "AIzaSyBDCtd9CazvqlKdk0rB7U4213ldXEdnYBU";
const genAI = new GoogleGenerativeAI(apiKey);

async function testModel(modelName) {
    console.log(`Testing model: ${modelName}...`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        console.log(`✅ SUCCESS: ${modelName}`);
        console.log(`Response: ${response.text().substring(0, 50)}...`);
        return true;
    } catch (error) {
        console.log(`❌ FAILED: ${modelName}`);
        console.log(`Error: ${error.message.split('\n')[0]}`);
        return false;
    }
}

async function runTests() {
    const models = [
        "gemini-flash-latest",
        "gemini-pro-latest",
        "gemini-1.5-flash",
        "gemini-2.0-flash-lite-preview-02-05"
    ];

    for (const model of models) {
        await testModel(model);
    }
}

runTests();
