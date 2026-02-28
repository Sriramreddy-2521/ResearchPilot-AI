import requests
import json
import os
from typing import List, Dict, Any
from core.config import settings

class SearchService:
    def __init__(self):
        self.wikipedia_api_url = "https://en.wikipedia.org/w/api.php"
        self.db_path = os.path.join(settings.UPLOAD_DIR, "search_data.json")
        self._ensure_db()

    def _ensure_db(self):
        """Ensure the JSON database file exists for tracking."""
        if not os.path.exists(self.db_path):
            with open(self.db_path, "w") as f:
                json.dump({"searches": [], "interactions": []}, f)

    def _read_db(self) -> Dict[str, List[Any]]:
        with open(self.db_path, "r") as f:
            return json.load(f)

    def _write_db(self, data: Dict[str, List[Any]]):
        with open(self.db_path, "w") as f:
            json.dump(data, f, indent=4)

    def search_wikipedia(self, query: str, user_id: str = "default_user") -> List[Dict[str, Any]]:
        """Search Wikipedia and log the query."""
        # Log the search
        self.record_search(user_id, query)

        # Perform the search against Wikipedia API
        params = {
            "action": "query",
            "list": "search",
            "srsearch": query,
            "format": "json",
            "utf8": 1
        }
        
        headers = {
            "User-Agent": "ResearchPilotAI/1.0 (https://github.com/yourusername/researchpilot)"
        }
        
        try:
            response = requests.get(self.wikipedia_api_url, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            results = []
            for item in data.get("query", {}).get("search", []):
                results.append({
                    "title": item["title"],
                    "snippet": item["snippet"],
                    "pageid": item["pageid"],
                    "url": f"https://en.wikipedia.org/?curid={item['pageid']}"
                })
            return results
        except requests.RequestException as e:
            print(f"Wikipedia API error: {e}")
            return []

    def get_wikipedia_text(self, pageid: str) -> str:
        """Fetch the full plain text extract of a Wikipedia article."""
        params = {
            "action": "query",
            "prop": "extracts",
            "pageids": pageid,
            "explaintext": 1,
            "format": "json",
            "utf8": 1
        }
        headers = {
            "User-Agent": "ResearchPilotAI/1.0 (https://github.com/yourusername/researchpilot)"
        }
        try:
            response = requests.get(self.wikipedia_api_url, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
            pages = data.get("query", {}).get("pages", {})
            return pages.get(str(pageid), {}).get("extract", "")
        except requests.RequestException as e:
            print(f"Wikipedia API error fetching extract: {e}")
            return ""

    def record_search(self, user_id: str, query: str):
        """Log a search query for personalization."""
        import time
        db = self._read_db()
        db["searches"].append({
            "user_id": user_id,
            "query": query,
            "timestamp": time.time()
        })
        self._write_db(db)

    def record_interaction(self, user_id: str, pageid: str, title: str):
        """Log when a user clicks a specific search result."""
        import time
        db = self._read_db()
        db["interactions"].append({
            "user_id": user_id,
            "pageid": pageid,
            "title": title,
            "timestamp": time.time()
        })
        self._write_db(db)

    def get_feed(self, user_id: str = "default_user") -> List[Dict[str, Any]]:
        """Generate a personalized feed based on recent interactions and searches."""
        db = self._read_db()
        
        # Get user's recent activity
        user_searches = [s for s in db.get("searches", []) if s.get("user_id") == user_id]
        user_interactions = [i for i in db.get("interactions", []) if i.get("user_id") == user_id]
        
        # Sort by timestamp descending
        user_searches.sort(key=lambda x: x.get("timestamp", 0), reverse=True)
        user_interactions.sort(key=lambda x: x.get("timestamp", 0), reverse=True)
        
        # Extract terms to build a heuristic query
        terms = []
        
        # Add titles from up to 2 most recent interactions
        for interaction in user_interactions[:2]:
            terms.append(interaction["title"])
            
        # Add queries from up to 2 most recent searches
        for search in user_searches[:2]:
            if search["query"] not in terms:
                   terms.append(search["query"])
                   
        if not terms:
            # Fallback if no history
            heuristic_query = "Artificial Intelligence OR Research OR Science"
        else:
            # Combine terms into a single discovery query.
            # Wikipedia search handles terms separated by spaces nicely.
            heuristic_query = " ".join(terms)
            
        print(f"Generating feed for {user_id} using heuristic: {heuristic_query}")
        
        # Execute the discovery search to build the feed
        # We don't want to log this discovery search in the user's explicit history
        params = {
            "action": "query",
            "list": "search",
            "srsearch": heuristic_query,
            "format": "json",
            "utf8": 1
        }
        
        headers = {
            "User-Agent": "ResearchPilotAI/1.0 (https://github.com/yourusername/researchpilot)"
        }
        
        try:
            response = requests.get(self.wikipedia_api_url, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            feed_results = []
            for item in data.get("query", {}).get("search", []):
                # Optionally filter out articles the user has already interacted with
                if any(i.get("pageid") == str(item["pageid"]) for i in user_interactions):
                    continue
                    
                feed_results.append({
                    "title": item["title"],
                    "snippet": item["snippet"],
                    "pageid": item["pageid"],
                    "url": f"https://en.wikipedia.org/?curid={item['pageid']}"
                })
                
            return feed_results
        except requests.RequestException as e:
             print(f"Feed generation error: {e}")
             return []

search_service = SearchService()
