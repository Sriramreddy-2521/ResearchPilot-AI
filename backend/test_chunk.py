from core.config import settings
from services.rag_service import rag_service

print("API KEY length:", len(settings.GEMINI_API_KEY) if settings.GEMINI_API_KEY else 0)

# try processing a dummy text
success = rag_service.process_and_store_document("Hello world. The AI is working.", "test_id_123", {"source": "test"})
print("Processing success:", success)
