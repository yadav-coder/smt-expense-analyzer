import { useEffect, useState } from "react";
import "./CategoryManager.css";
import {
  deleteCategory,
  getCategories,
  renameCategory
} from "../services/api";
import { toast } from "react-toastify";

function CategoryManager({ expensesVersion, onCategoriesChanged }) {

  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [newName, setNewName] = useState("");

  // =========================

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.message || "Failed to load categories");
    }
  };

  // =========================

  const startRename = (cat) => {
    setEditing(cat);
    setNewName(cat);
  };

  const saveRename = async () => {
    if (!newName.trim()) return;

    try {
      await renameCategory(editing, newName.trim());

      setEditing(null);
      setNewName("");
      await loadCategories();
      onCategoriesChanged?.();
      toast.success("Category renamed");
    } catch (error) {
      toast.error(error.message || "Failed to rename category");
    }
  };

  const handleDeleteCategory = async (name) => {
    try {
      await deleteCategory(name);
      await loadCategories();
      onCategoriesChanged?.();
      toast.info("Category moved to Other");
    } catch (error) {
      toast.error(error.message || "Failed to delete category");
    }
  };

  // =========================

  useEffect(() => {
    loadCategories();
  }, [expensesVersion]);

  // =========================

  return (
    <div className="cat-box">

      <h3>Manage Categories</h3>

      {categories.length === 0 && (
        <p className="empty-state">Categories will appear after expenses are saved.</p>
      )}

      {categories.map((cat) => (
        <div key={cat} className="cat-row">

          {editing === cat ? (
            <>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />

              <button onClick={saveRename}>
                Save
              </button>

              <button onClick={() => setEditing(null)}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <span>{cat}</span>

              <button onClick={() => startRename(cat)}>
                Rename
              </button>

              <button
                className="delete"
                onClick={() => handleDeleteCategory(cat)}
              >
                Delete
              </button>
            </>
          )}

        </div>
      ))}

    </div>
  );
}

export default CategoryManager;
