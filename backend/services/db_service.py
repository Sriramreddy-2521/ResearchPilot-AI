from pymongo import MongoClient
from core.config import settings

class DBService:
    def __init__(self):
        try:
            self.client = MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=5000)
            self.db = self.client["researchpilot_db"]
            self.docs_collection = self.db["documents"]
            # Test connection
            self.client.server_info()
            print("Successfully connected to MongoDB.")
        except Exception as e:
            print(f"Failed to connect to MongoDB: {e}")

    def save_document(self, doc_data: dict):
        """Save or update a document record. Expects an 'id' field in dict."""
        doc_data["_id"] = doc_data["id"] # Use the UUID as Mongo's primary key
        self.docs_collection.update_one(
            {"_id": doc_data["id"]},
            {"$set": doc_data},
            upsert=True
        )

    def get_document(self, doc_id: str) -> dict:
        """Retrieve a single document by ID."""
        doc = self.docs_collection.find_one({"_id": doc_id})
        if doc and "id" not in doc:
            doc["id"] = doc["_id"]
        return doc
        
    def get_all_documents(self) -> list:
        """Retrieve all summarized/metadata fields for the dashboard listing."""
        # Exclude large full_text fields from the initial listing to save memory
        cursor = self.docs_collection.find({}, {"full_text": 0})
        docs = []
        for doc in cursor:
            if "id" not in doc:
                doc["id"] = doc["_id"]
            docs.append(doc)
        return docs

db_service = DBService()
