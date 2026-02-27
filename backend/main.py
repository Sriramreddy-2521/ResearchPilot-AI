import os
from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from core.config import settings
from services.document_service import document_service
from services.rag_service import rag_service
from services.rag_service import rag_service
from services.audio_service import audio_service
from services.db_service import db_service

app = FastAPI(
    title="ResearchPilot AI API",
    description="Backend for the ResearchPilot AI Agent",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    document_id: str = None
    query: str

class SummarizeRequest(BaseModel):
    document_id: str

class CompareRequest(BaseModel):
    document_id_1: str
    document_id_2: str

# DB_DOCUMENTS has been replaced by db_service (MongoDB)

def background_process_pdf(file_path: str, file_name: str, file_id: str):
    """Extracts text and pushes to ChromaDB in background."""
    print(f"Background processing started for {file_name}")
    try:
        doc_info = document_service.process_document(file_path, file_name, file_id)
        # Assuming extract_text_from_pdf can be called again or cached (we will just extract)
        text = document_service.extract_text_from_pdf(file_path)
        
        metadata = {"document_id": file_id, "filename": file_name}
        success = rag_service.process_and_store_document(text, file_id, metadata)
        
        db_service.save_document({
            "id": file_id,
            "filename": file_name,
            "status": "ready" if success else "failed",
            "extracted_length": len(text),
            "full_text": text
        })
    except Exception as e:
        print(f"Failed to process document {file_id}: {e}")
        db_service.save_document({
            "id": file_id,
            "filename": file_name,
            "status": "error",
            "full_text": ""
        })

@app.post("/api/upload")
async def upload_document(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    file_path, file_id = await document_service.save_upload_file(file)
    
    # Store initial state
    db_service.save_document({
        "id": file_id,
        "filename": file.filename,
        "status": "processing"
    })
    
    # Add extraction and embedding to background task
    background_tasks.add_task(background_process_pdf, file_path, file.filename, file_id)
    
    return {"document_id": file_id, "filename": file.filename, "status": "processing"}

@app.get("/api/documents")
async def list_documents():
    return {"documents": db_service.get_all_documents()}

@app.post("/api/query")
async def query_document(req: QueryRequest):
    if not req.query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")
        
    answer = rag_service.query_document(req.query, document_id=req.document_id)
    return {"answer": answer}

@app.post("/api/summarize")
async def summarize_document(req: SummarizeRequest):
    doc = db_service.get_document(req.document_id)
    if doc and "summary" in doc:
        return {"summary": doc["summary"]}

    # This feature will just use RAG to generate a summary
    # A generic query that forces the LLM to output summary format
    summary_query = "Provide a comprehensive summary of this research paper including: 1. Short overview, 2. Key contributions, 3. Methodology, and 4. Results."
    summary = rag_service.query_document(summary_query, document_id=req.document_id, top_k=10)
    
    if doc:
        doc["summary"] = summary
        db_service.save_document(doc)
        
    return {"summary": summary}

@app.post("/api/compare")
async def compare_documents(req: CompareRequest):
    return {"comparison": "Compare feature not fully implemented yet."}

@app.post("/api/podcast")
async def generate_podcast(req: SummarizeRequest):
    script_query = "Act as two hosts on a tech podcast. Write a short, engaging conversational script summarizing this research paper. CRITICAL: Output ONLY spoken dialogue in raw text format. Do NOT use markdown, do NOT use asterisks (*) for emphasis, and do NOT include sound effect directions (like *laughs* or *intro music*). Write it exactly as it should be read aloud."
    script = rag_service.query_document(script_query, document_id=req.document_id, top_k=5)
    
    # Generate Audio
    audio_path = audio_service.generate_podcast_audio(script, req.document_id)
    if not audio_path:
        raise HTTPException(status_code=500, detail="Failed to generate audio")
        
    doc = db_service.get_document(req.document_id)
    if doc:
        doc["podcast_script"] = script
        db_service.save_document(doc)
        
    return {"script": script, "audio_url": f"/api/audio/{req.document_id}"}

@app.get("/api/audio/{document_id}")
async def get_audio(document_id: str):
    path = audio_service.get_audio_path(document_id)
    if not path:
        raise HTTPException(status_code=404, detail="Audio not found")
    from fastapi.responses import FileResponse
    return FileResponse(path, media_type="audio/mpeg")

@app.post("/api/mindmap")
async def generate_mindmap(req: SummarizeRequest):
    doc = db_service.get_document(req.document_id)
    if not doc or "full_text" not in doc:
        raise HTTPException(status_code=404, detail="Document text not found. Please re-upload the paper.")
        
    if "mindmap" in doc:
        return {"mindmap_data": doc["mindmap"]}

    mindmap_query = f"""Generate a strictly typed hierarchical JSON structure representing a mind map of the paper's core concepts. 
The root node MUST be the paper title. It must have branches for Problem, Methodology, and Results.
Use EXACTLY this JSON schema format:
```json
{{
  "name": "Node Label",
  "children": [
    {{ "name": "Child Label", "children": [] }}
  ]
}}
```
Return ONLY valid JSON format, without markdown wrapping or code blocks.

Paper Context:
{doc['full_text'][:150000]}
"""
    try:
        response = rag_service.client.models.generate_content(
            model='gemini-2.5-flash',
            contents=mindmap_query
        )
        mindmap_raw = response.text
    except Exception as e:
        mindmap_raw = '{"name": "Error contacting Gemini", "children": []}'
        
    # Strip markdown if Gemini accidentally included it
    if mindmap_raw.startswith("```json"):
        mindmap_raw = mindmap_raw.split("```json")[1].split("```")[0].strip()
    elif mindmap_raw.startswith("```"):
         mindmap_raw = mindmap_raw.split("```")[1].split("```")[0].strip()
         
    import json
    try:
        mindmap_json = json.loads(mindmap_raw)
    except json.JSONDecodeError:
        mindmap_json = {"name": "Error Parsing Mindmap", "children": [{"name": "Raw output", "children": [{"name": mindmap_raw}]}]}

    doc["mindmap"] = mindmap_json
    db_service.save_document(doc)

    return {"mindmap_data": mindmap_json}

@app.post("/api/video")
async def generate_video_script(req: SummarizeRequest):
    script_query = "Create a 3-part storyboard for an explainer video of this paper. Include visual cues and voiceover text for each part."
    script = rag_service.query_document(script_query, document_id=req.document_id, top_k=5)
    return {"video_script": script, "status": "Video generation pipeline (rendering) is mocked for lightweight demo."}
