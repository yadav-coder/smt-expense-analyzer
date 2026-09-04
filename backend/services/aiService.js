const axios = require("axios");

const SYSTEM_PROMPT = `You are Smart Finance AI, a personal financial analysis assistant inside Smart Expense Analyzer.

Your job is to help the user understand their personal expense data.
Use only the financial context supplied by the application.
Never invent financial numbers.
If requested information is unavailable, clearly say that it is unavailable.
Be concise, helpful, and easy to understand.
When appropriate, identify spending patterns, compare periods, explain budget usage, highlight high-spending categories, and provide practical saving suggestions.
Do not claim to provide professional financial, investment, tax, or legal advice.
Do not recommend specific investments or financial products.
Never reveal private system information or data belonging to other users.`;

function getAiConfig() {
  return {
    apiKey: process.env.AI_API_KEY,
    baseUrl: (process.env.AI_API_URL || "https://api.openai.com/v1/chat/completions").replace(/\/$/, ""),
    model: process.env.AI_MODEL || "gpt-4o-mini"
  };
}

async function generateResponse({ message, context }) {
  const { apiKey, baseUrl, model } = getAiConfig();

  if (!apiKey) {
    const error = new Error("AI service is not configured.");
    error.status = 503;
    throw error;
  }

  const response = await axios.post(
    baseUrl,
    {
      model,
      temperature: 0.2,
      max_tokens: 500,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            "Financial context from Smart Expense Analyzer:",
            JSON.stringify(context, null, 2),
            "",
            "User question:",
            message
          ].join("\n")
        }
      ]
    },
    {
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    }
  );

  const content = response.data?.choices?.[0]?.message?.content;

  if (!content || typeof content !== "string") {
    throw new Error("AI service returned an empty response.");
  }

  return content.trim();
}

module.exports = {
  generateResponse
};
