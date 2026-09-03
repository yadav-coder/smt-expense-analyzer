import { useState } from "react";
import "./CategoryModal.css";

function CategoryModal({ title, onSave, onClose }) {

  const [customCategory, setCustomCategory] = useState("");
  const [showInput, setShowInput] = useState(false);

  const categories = [
    "Food",
    "Transport",
    "Clothing",
    "Electronics",
    "Mobile",
    "Other"
  ];

  const handleClick = (cat) => {
    if (cat === "Other") {
      setShowInput(true);
    } else {
      onSave(cat);
    }
  };

  const handleCustomSave = () => {
    if (!customCategory.trim()) return;
    onSave(customCategory.trim());
  };

  return (
    <div className="modal-overlay" role="presentation">
      <div className="modal-box" role="dialog" aria-modal="true" aria-labelledby="category-title">

        <h3 id="category-title">Select Category</h3>
        <p><b>{title}</b></p>

        {!showInput && (
          <div className="category-grid">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleClick(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {showInput && (
          <>
            <input
              type="text"
              placeholder="Enter Category"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
            />

            <button
              className="save-btn"
              onClick={handleCustomSave}
            >
              Save
            </button>
          </>
        )}

        <button type="button" className="close-btn" onClick={onClose}>
          Cancel
        </button>

      </div>
    </div>
  );
}

export default CategoryModal;
