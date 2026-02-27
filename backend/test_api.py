from google import genai
from core.config import settings
import chromadb
import os

print("Testing Gemini GenAI...")
client = genai.Client(api_key=settings.GEMINI_API_KEY)

try:
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents="Say hello"
    )
    print("Generation successful:", response.text)
except Exception as e:
    print("Error generating:", e)

try:
    response = client.models.embed_content(
        model='text-embedding-004',
        contents="Say hello"
    )
    print("Embedding successful")
except Exception as e:
    print("Error embedding:", e)

print("Testing ChromaDB...")
try:
    os.makedirs(settings.CHROMA_DB_PATH, exist_ok=True)
    chroma_client = chromadb.PersistentClient(path=settings.CHROMA_DB_PATH)
    collection = chroma_client.get_or_create_collection(name="test_coll")
    
    collection.add(
        documents=["test"],
        embeddings=[[0.1] * 768],
        ids=["id1"]
    )
    print("ChromaDB successful")
except Exception as e:
    print("Error ChromaDB:", e)
