import React from "react";

function renderMessageContent(content) {
  if (typeof content !== "string") {
    return String(content || "");
  }

  const lines = content.split("\n");
  const elements = [];
  let currentList = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`}>
          {currentList.map((item, idx) => (
            <li key={idx}>{parseInlineFormatting(item)}</li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  const parseInlineFormatting = (text) => {
    // Basic bold parsing: **text**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    // Bullet line
    if (/^[-*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      const cleanItem = trimmed.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "");
      currentList.push(cleanItem);
      return;
    }

    flushList();

    // Bold section heading
    if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      elements.push(
        <strong key={`h-${index}`} className="message-heading">
          {trimmed.slice(2, -2)}
        </strong>
      );
      return;
    }

    elements.push(<p key={`p-${index}`}>{parseInlineFormatting(line)}</p>);
  });

  flushList();
  return elements;
}

export default function ChatMessage({ role, content, isThinking = false, timestamp }) {
  const isAssistant = role === "assistant";

  return (
    <article className={`chat-message ${isAssistant ? "assistant" : "user"}`}>
      <span className="chat-avatar" aria-hidden="true">
        {isAssistant ? "AI" : "You"}
      </span>
      <div className={`message-bubble ${isThinking ? "thinking" : ""}`}>
        {isThinking ? (
          <div>
            Smart Finance AI is thinking<span>.</span><span>.</span><span>.</span>
          </div>
        ) : (
          <>
            {renderMessageContent(content)}
            {timestamp && <span className="message-timestamp">{timestamp}</span>}
          </>
        )}
      </div>
    </article>
  );
}
