import os
from gtts import gTTS
from core.config import settings

class AudioService:
    def __init__(self):
        self.audio_dir = os.path.join(settings.UPLOAD_DIR, "audio")
        os.makedirs(self.audio_dir, exist_ok=True)

    def generate_podcast_audio(self, script_text: str, document_id: str) -> str:
        """Converts text script into an audio file using gTTS."""
        output_path = os.path.join(self.audio_dir, f"{document_id}.mp3")
        try:
            tts = gTTS(text=script_text, lang='en', slow=False)
            tts.save(output_path)
            return output_path
        except Exception as e:
            print(f"Error generating audio: {e}")
            return None

    def get_audio_path(self, document_id: str) -> str:
        path = os.path.join(self.audio_dir, f"{document_id}.mp3")
        if os.path.exists(path):
            return path
        return None

audio_service = AudioService()
