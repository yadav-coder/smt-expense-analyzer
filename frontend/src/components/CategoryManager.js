import { useEffect, useState } from "react";
import "./CategoryManager.css";
import {
  deleteCategory,
  getCategories,
  renameCategory
} from "../services/api";

function CategoryManager() {

  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [newName, setNewName] = useState("");

  // =========================

  const loadCategories = async () => {
    const data = await getCategories();
    setCategories(Array.isArray(data) ? data : []);
  };

  // =========================

  const startRename = (cat) => {
    setEditing(cat);
    setNewName(cat);
  };

  const saveRename = async () => {
    if (!newName) return;

    await renameCategory(editing, newName);

    setEditing(null);
    setNewName("");
    loadCategories();
  };

  const handleDeleteCategory = async (name) => {
    await deleteCategory(name);
    loadCategories();
  };

  // =========================

  useEffect(() => {
    loadCategories();
  }, []);

  // =========================

  return (
    <div className="cat-box">

      <h3>Manage Categories</h3>

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
