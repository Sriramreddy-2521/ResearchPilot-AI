import os
import chromadb
from google import genai
from core.config import settings

class RAGService:
    def __init__(self):
        # Initialize GenAI Client
        # The key should be passed either via env GEMINI_API_KEY
        # If not, it will fail gracefully during generation if not set
        self.client = None
        if settings.GEMINI_API_KEY:
             self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        
        # Initialize ChromaDB client
        os.makedirs(settings.CHROMA_DB_PATH, exist_ok=True)
        self.chroma_client = chromadb.PersistentClient(path=settings.CHROMA_DB_PATH)
        self.collection = self.chroma_client.get_or_create_collection(name="research_papers")

    def _chunk_text(self, text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> list[str]:
        """Simple token-efficient sliding window chunking."""
        chunks = []
        start = 0
        text_len = len(text)
        while start < text_len:
            end = min(start + chunk_size, text_len)
            # Find a proper boundary (e.g., newline or space) if possible
            if end < text_len:
                last_space = text.rfind(" ", start, end)
                if last_space != -1 and last_space > start + chunk_size // 2:
                    end = last_space
            
            chunks.append(text[start:end].strip())
            
            if end == text_len:
                break
                
            new_start = end - chunk_overlap
            
            # Prevent infinite loop if overlap is too large or start doesn't advance
            if new_start <= start:
                start = end
            else:
                start = new_start
                
        return chunks

    def process_and_store_document(self, text: str, document_id: str, metadata: dict):
        """Chunks text, creates embeddings, and stores in Chroma."""
        if not self.client:
            print("Warning: Gemini API Key not set. Cannot store document embeddings.")
            return False

        chunks = self._chunk_text(text)
        
        # Note: We can rely on ChromaDB's default embedding function, 
        # or we can explicitly use Gemini embeddings. 
        # For simplicity and token-efficiency, let's use Gemini's text-embedding-004.
        
        try:
            # Create embeddings in batches (simplification: one-by-one here, could be batched)
            for i, chunk in enumerate(chunks):
                if not chunk: continue
                
                # We use the new google-genai SDK 
                response = self.client.models.embed_content(
                    model='gemini-embedding-001',
                    contents=chunk,
                )
                embedding = response.embeddings[0].values
                
                self.collection.add(
                    documents=[chunk],
                    embeddings=[embedding],
                    metadatas=[{**metadata, "chunk_index": i}],
                    ids=[f"{document_id}_chunk_{i}"]
                )
            return True
        except Exception as e:
            print(f"Error processing document to Vector DB: {e}")
            return False

    def query_document(self, query: str, document_id: str = None, top_k: int = 5) -> str:
        """Retrieves top-k relevant chunks and queries Gemini."""
        if not self.client:
            return "Error: Gemini API key not configured."
            
        try:
            # 1. Embed query
            response = self.client.models.embed_content(
                model='gemini-embedding-001',
                contents=query,
            )
            query_embedding = response.embeddings[0].values
            
            # 2. Retrieve chunks
            filter_dict = {"document_id": document_id} if document_id else None
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where=filter_dict
            )
            
            if not results['documents'] or not results['documents'][0]:
                return "No relevant context found in the document to answer your query."
                
            retrieved_chunks = results['documents'][0]
            context = "\n\n---\n\n".join(retrieved_chunks)
            
            # 3. Augment prompt
            prompt = f"""
            You are ResearchPilot AI, an expert research assistant.
            Use only the following context chunks retrieved from the paper to answer the user's query.
            If the context does not contain the answer, say "I cannot find the answer in the provided document context."
            
            Context:
            {context}
            
            Query: {query}
            
            Answer:
            """
            
            # 4. Generate answer
            gen_response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
            )
            
            return gen_response.text
            
        except Exception as e:
            error_str = str(e)
            if "RESOURCE_EXHAUSTED" in error_str or "429" in error_str:
                return "⚠️ **Gemini API Rate Limit Exceeded:** You are using the Free Tier of Gemini, which allows around 15 requests per minute. Please wait 30 seconds and try again."
            return f"Error during query generation: {error_str}"

rag_service = RAGService()
