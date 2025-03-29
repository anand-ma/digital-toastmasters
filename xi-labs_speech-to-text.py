from io import BytesIO
from elevenlabs.client import ElevenLabs
import os

# Initialize the ElevenLabs client
client = ElevenLabs(
    api_key="sk_b28a30dd43efe6a7c4f107d8a7536d5573e3161c1c2104aa",
)

# Path to your local audio file
local_audio_path = "video.mp4"  # Change this to your actual file path

# Open and read the local file
with open(local_audio_path, "rb") as f:
    audio_data = BytesIO(f.read())

# Convert speech to text
transcription = client.speech_to_text.convert(
    file=audio_data,
    model_id="scribe_v1",  # Model to use, for now only scribe_v1 is available
)

# Print results
print(f"File path: {local_audio_path}")
print("\n")
print(audio_data)
print("\n")
print(transcription)
print("\n")
print(transcription.text)