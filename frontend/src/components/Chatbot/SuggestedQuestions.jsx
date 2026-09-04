import React from "react";

export const DEFAULT_SUGGESTIONS = [
  "How much did I spend this month?",
  "Where am I spending the most?",
  "Am I within my budget?",
  "How much did I spend on food?",
  "Compare this month with last month.",
  "How can I reduce my expenses?"
];

export default function SuggestedQuestions({ onSelectQuestion, disabled = false }) {
  return (
    <div className="suggestion-row" aria-label="Suggested questions">
      {DEFAULT_SUGGESTIONS.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          className="suggestion-chip"
          onClick={() => onSelectQuestion(suggestion)}
          disabled={disabled}
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
