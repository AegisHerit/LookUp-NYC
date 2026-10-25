import json, os, sys, traceback
import numpy as np, soundfile as sf
from kokoro import KPipeline
lines = json.load(open('vo/lines.json'))
pipe = KPipeline(lang_code='a')
out = {}
for voice in sys.argv[1].split(','):
    os.makedirs(f'vo/out/{voice}', exist_ok=True)
    for i, text in enumerate(lines, 1):
        try:
            audio = np.concatenate([np.asarray(a) for _, _, a in pipe(text, voice=voice, speed=1.05)])
            sf.write(f'vo/out/{voice}/{i:02d}.wav', audio, 24000)
            out[f'{voice}/{i:02d}'] = round(len(audio) / 24000, 2)
            print(voice, i, out[f'{voice}/{i:02d}'], flush=True)
        except Exception:
            traceback.print_exc()
json.dump(out, open('vo/out/durations.json', 'w'), indent=1)
