import React, { useState } from "react";
import ChatWindow from "../components/Chatbot/ChatWindow";
import ChatInput from "../components/Chatbot/ChatInput";
import SuggestedQuestions from "../components/Chatbot/SuggestedQuestions";
import { sendAiChatMessage } from "../services/api";

export default function AIAssistant({ budget, prediction }) {
  const [messages, setMessages] = useState([
    {
      id: "welcome-msg",
      role: "assistant",
      content:
        "Hi! I'm Smart Finance AI.\nI can help you understand your expenses, budget and financial trends."
    }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSendMessage = async (text) => {
    const trimmed = String(text || "").trim();
    if (!trimmed || isThinking) return;

    setErrorMessage(null);
    const userMsg = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const result = await sendAiChatMessage({
        message: trimmed,
        monthlyBudget: budget,
        predictedNextMonthExpense: prediction
      });

      const aiMsg = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: result?.message || "I was unable to generate a response. Please try again."
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const fallbackText =
        err?.message || "I'm unable to process your request right now. Please check if the chatbot service is active.";
      setErrorMessage(fallbackText);
      const aiErrorMsg = {
        id: `ai-err-${Date.now()}`,
        role: "assistant",
        content: fallbackText
      };
      setMessages((prev) => [...prev, aiErrorMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h2>AI Financial Assistant</h2>
          <p>Ask questions about your spending and get personalized financial insights.</p>
        </div>
      </header>

      <section className="ai-assistant-panel">
        <div className="ai-intro">
          <div className="ai-avatar">AI</div>
          <div>
            <h3>Smart Finance AI</h3>
            <p>Your personal expense analysis assistant.</p>
          </div>
        </div>

        <SuggestedQuestions
          onSelectQuestion={handleSendMessage}
          disabled={isThinking}
        />

        <ChatWindow
          messages={messages}
          isThinking={isThinking}
          error={errorMessage}
        />

        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isThinking}
          maxLength={600}
        />
      </section>
    </>
  );
}
