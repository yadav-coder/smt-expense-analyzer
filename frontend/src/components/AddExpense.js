import { useState } from "react";
import { addExpensesBulk } from "../services/api";
import { scanReceipt } from "../services/ocrApi";

function AddExpense({ onAddExpense, onExpensesAdded }) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");

  // New state for receipt upload
  const [receiptFile, setReceiptFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [addingItems, setAddingItems] = useState(false);
  const [ocrError, setOcrError] = useState("");
  const [ocrStatus, setOcrStatus] = useState("");
  const [ocrRawText, setOcrRawText] = useState("");
  const [scannedItems, setScannedItems] = useState([]);

  const categories = [
    "Food",
    "Groceries",
    "Transport",
    "Rent",
    "Bills",
    "Health",
    "Education",
    "Clothing",
    "Electronics",
    "Mobile",
    "Other"
  ];

  const submitHandler = (event) => {
    event.preventDefault();

    if (!title.trim() || Number(amount) <= 0) return;

    onAddExpense({
      title: title.trim(),
      amount,
      category,
      date,
    });

    setTitle("");
    setAmount("");
    setCategory("");
    setDate("");
    setReceiptFile(null);
    setPreviewUrl("");
    setOcrError("");
    setOcrStatus("");
    setOcrRawText("");
    setScannedItems([]);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceiptFile(file);
      setPreviewUrl(file.type.startsWith("image/") ? URL.createObjectURL(file) : "");
      setOcrError("");
      setOcrStatus("");
      setOcrRawText("");
      setScannedItems([]);
    }
  };

  const buildScannedItems = (data) => {
    const detectedItems = Array.isArray(data.items) ? data.items : [];

    return detectedItems
      .filter((item) => item.name && Number(item.amount) > 0)
      .map((item, index) => ({
        id: `${Date.now()}-${index}`,
        selected: true,
        title: item.name,
        amount: String(item.amount),
        category: item.category || data.category || "Other",
        date: data.date || ""
      }));
  };

  const handleScan = async () => {
    if (!receiptFile) return;
    setLoading(true);
    setOcrError("");
    setOcrStatus("");
    setOcrRawText("");
    try {
      const data = await scanReceipt(receiptFile);
      // Populate fields if data present
      if (data.merchant) setTitle(data.merchant);
      if (data.amount) setAmount(data.amount);
      if (data.category) setCategory(data.category);
      if (data.date) setDate(data.date);
      const nextItems = buildScannedItems(data);
      setScannedItems(nextItems);
      setOcrRawText(data.rawText || "");
      setOcrStatus(
        nextItems.length
          ? `Scan complete. Review ${nextItems.length} detected item${nextItems.length === 1 ? "" : "s"} below.`
          : "Scan complete, but no item rows were detected. Try uploading a clearer full receipt."
      );
    } catch (err) {
      setOcrError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateScannedItem = (id, field, value) => {
    setScannedItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const toggleScannedItem = (id) => {
    setScannedItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const addSelectedScannedItems = async () => {
    const selectedItems = scannedItems
      .filter((item) => item.selected)
      .map((item) => ({
        title: item.title,
        amount: item.amount,
        category: item.category,
        date: item.date
      }));

    if (!selectedItems.length) {
      setOcrError("Select at least one receipt item to add.");
      return;
    }

    try {
      setAddingItems(true);
      setOcrError("");
      await addExpensesBulk(selectedItems);
      setOcrStatus(`${selectedItems.length} receipt item${selectedItems.length === 1 ? "" : "s"} added to expenses.`);
      setScannedItems([]);
      if (onExpensesAdded) await onExpensesAdded();
    } catch (err) {
      setOcrError(err.message);
    } finally {
      setAddingItems(false);
    }
  };

  return (
    <>
      {/* Receipt Scan Section */}
      <div className="receipt-scan-card" style={{ marginBottom: "1rem", padding: "1rem", border: "1px solid #ccc", borderRadius: "8px" }}>
        <h3>Scan Receipt</h3>
        <p>Upload a bill or receipt to automatically fill expense details.</p>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleFileChange}
        />
        {previewUrl && (
          <div style={{ marginTop: "0.5rem" }}>
            <img src={previewUrl} alt="Receipt preview" style={{ maxWidth: "100%", maxHeight: "200px" }} />
          </div>
        )}
        <button type="button" onClick={handleScan} disabled={!receiptFile || loading} style={{ marginTop: "0.5rem" }}>
          {loading ? "Scanning receipt..." : "Scan Receipt"}
        </button>
        {ocrStatus && <p style={{ color: "#166534" }}>{ocrStatus}</p>}
        {ocrError && <p style={{ color: "red" }}>{ocrError}</p>}
        {ocrRawText && (
          <details className="ocr-response">
            <summary>OCR Response</summary>
            <pre>{ocrRawText}</pre>
          </details>
        )}
      </div>

      {scannedItems.length > 0 && (
        <div className="receipt-items-panel">
          <div className="panel-header">
            <h3>Receipt Items</h3>
            <button type="button" onClick={addSelectedScannedItems} disabled={addingItems}>
              {addingItems ? "Adding..." : "Add Selected Items"}
            </button>
          </div>

          <div className="receipt-items-list">
            <div className="receipt-items-head">
              <span>Add</span>
              <span>Item</span>
              <span>Amount</span>
              <span>Category</span>
            </div>

            {scannedItems.map((item) => (
              <div className="receipt-item-row" key={item.id}>
                <input
                  aria-label={`Select ${item.title}`}
                  checked={item.selected}
                  onChange={() => toggleScannedItem(item.id)}
                  type="checkbox"
                />
                <input
                  aria-label="Receipt item title"
                  value={item.title}
                  onChange={(e) => updateScannedItem(item.id, "title", e.target.value)}
                />
                <input
                  aria-label="Receipt item amount"
                  min="0.01"
                  step="0.01"
                  type="number"
                  value={item.amount}
                  onChange={(e) => updateScannedItem(item.id, "amount", e.target.value)}
                />
                <select
                  aria-label="Receipt item category"
                  value={item.category}
                  onChange={(e) => updateScannedItem(item.id, "category", e.target.value)}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      <form className="expense-form" onSubmit={submitHandler}>
        <h3>Add Expense</h3>

        <label>
          Title
          <input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        <label>
          Amount
          <input
            placeholder="Amount"
            type="number"
            min="1"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>

        <label>
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Auto category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>

        <label>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>

        <button type="submit">Add</button>
      </form>
    </>
  );
}

export default AddExpense;
