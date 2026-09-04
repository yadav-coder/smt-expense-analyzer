import React, { useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage";

export default function ChatWindow({ messages = [], isThinking = false, error = null }) {
  const scrollBottomRef = useRef(null);

  useEffect(() => {
    scrollBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isThinking]);

  return (
    <div className="chat-window" aria-live="polite">
      {messages.map((msg, index) => (
        <ChatMessage
          key={msg.id || index}
          role={msg.role}
          content={msg.content}
          timestamp={msg.timestamp}
        />
      ))}

      {isThinking && <ChatMessage role="assistant" isThinking={true} />}

      {error && (
        <div className="chat-error-banner" role="alert" style={{
          padding: "10px 14px",
          borderRadius: "8px",
          background: "rgba(220, 38, 38, 0.1)",
          color: "var(--danger)",
          fontSize: "0.9rem"
        }}>
          {error}
        </div>
      )}

      <div ref={scrollBottomRef} />
    </div>
  );
}
