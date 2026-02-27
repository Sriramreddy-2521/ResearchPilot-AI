import os
import uuid
import pymupdf
from fastapi import UploadFile
from typing import Dict, Any, List

from core.config import settings

class DocumentService:
    def __init__(self):
        # Ensure upload directory exists
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    async def save_upload_file(self, file: UploadFile) -> str:
        """Saves the uploaded file to disk and returns its unique ID (path)."""
        file_id = str(uuid.uuid4())
        ext = os.path.splitext(file.filename)[1] if file.filename else ".pdf"
        file_path = os.path.join(settings.UPLOAD_DIR, f"{file_id}{ext}")
        
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
            
        return file_path, file_id

    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extracts text from a given PDF file using PyMuPDF."""
        text = ""
        try:
            doc = pymupdf.open(file_path)
            for page in doc:
                text += page.get_text()
            return text
        except Exception as e:
            print(f"Error extracting text from {file_path}: {e}")
            return ""

    def process_document(self, file_path: str, file_name: str, file_id: str) -> Dict[str, Any]:
        """Main orchestrator for processing a new document."""
        text = self.extract_text_from_pdf(file_path)
        
        # Here we would also trigger chunking and vector storage
        # (This will be implemented in the Vector/RAG service module)
        
        return {
            "document_id": file_id,
            "filename": file_name,
            "extracted_length": len(text)
        }

document_service = DocumentService()
