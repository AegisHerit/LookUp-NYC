import json, os, sys, traceback
import soundfile as sf
from kokoro_onnx import Kokoro
lines = json.load(open('vo/lines.json'))
k = Kokoro('kokoro-v1.0.onnx', 'voices-v1.0.bin')
out = {}
for voice in sys.argv[1].split(','):
    os.makedirs(f'vo/out/{voice}', exist_ok=True)
    for i, text in enumerate(lines, 1):
        try:
            audio, sr = k.create(text, voice=voice, speed=1.05, lang='en-us')
            sf.write(f'vo/out/{voice}/{i:02d}.wav', audio, sr)
            out[f'{voice}/{i:02d}'] = round(len(audio) / sr, 2)
            print(voice, i, out[f'{voice}/{i:02d}'], flush=True)
        except Exception:
            traceback.print_exc()
json.dump(out, open('vo/out/durations.json', 'w'), indent=1)
