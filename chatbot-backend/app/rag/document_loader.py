from pathlib import Path
from typing import List, Dict, Any

class DocumentLoader:
    """
    Loads financial knowledge documents from knowledge_base/
    Extracts structured topic, source, and title metadata from file headers.
    """

    def __init__(self, knowledge_base_dir: str):
        self.knowledge_base_dir = Path(knowledge_base_dir)

    def load_documents(self) -> List[Dict[str, Any]]:
        documents = []
        if not self.knowledge_base_dir.exists():
            return documents

        for file_path in self.knowledge_base_dir.glob("**/*.*"):
            if file_path.suffix.lower() not in [".txt", ".md"]:
                continue

            try:
                text = file_path.read_text(encoding="utf-8")
                metadata = self._extract_metadata(text, file_path)
                body = self._extract_body(text)

                documents.append({
                    "content": body,
                    "metadata": metadata,
                    "file_path": str(file_path)
                })
            except Exception as e:
                print(f"Warning: Could not read {file_path}: {e}")

        return documents

    def _extract_metadata(self, text: str, file_path: Path) -> Dict[str, Any]:
        lines = text.splitlines()
        metadata: Dict[str, Any] = {
            "source": file_path.name,
            "topic": file_path.parent.name,
            "title": file_path.stem.replace("_", " ").title()
        }

        for line in lines[:6]:
            line_str = line.strip()
            if line_str.lower().startswith("topic:"):
                metadata["topic"] = line_str.split(":", 1)[1].strip()
            elif line_str.lower().startswith("source:"):
                metadata["source"] = line_str.split(":", 1)[1].strip()
            elif line_str.lower().startswith("title:"):
                metadata["title"] = line_str.split(":", 1)[1].strip()

        return metadata

    def _extract_body(self, text: str) -> str:
        lines = text.splitlines()
        body_lines = []
        skip_headers = True

        for line in lines:
            line_str = line.strip()
            if skip_headers and (
                line_str.lower().startswith("topic:") or
                line_str.lower().startswith("source:") or
                line_str.lower().startswith("title:")
            ):
                continue
            skip_headers = False
            body_lines.append(line)

        return "\n".join(body_lines).strip()
