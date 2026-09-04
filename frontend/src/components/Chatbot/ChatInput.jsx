import React, { useState } from "react";

export default function ChatInput({ onSendMessage, disabled = false, maxLength = 600 }) {
  const [input, setInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || disabled) return;

    onSendMessage(trimmed);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form className="chat-input-row" onSubmit={handleSubmit}>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about your expenses, budget, or financial advice..."
        maxLength={maxLength}
        disabled={disabled}
        aria-label="Ask the AI financial assistant"
      />
      <button
        type="submit"
        disabled={disabled || !input.trim()}
        className="primary-btn"
      >
        Send
      </button>
    </form>
  );
}
