"""Read a narration script aloud with Kokoro, a free open-source voice model.

Usage: python tts.py SCRIPT VOICES SECTIONS SPEED
  SCRIPT    narration/<name>.txt, with sections that start with "## Title"
  VOICES    comma-separated Kokoro voices, e.g. af_heart,am_michael
  SECTIONS  "all" or comma-separated section numbers, e.g. 1 or 1,3
  SPEED     1.0 is normal

Writes narration/out/<name>/<voice>/<n>.mp3, one file per section.
"""
import os, re, subprocess, sys
import numpy as np
import soundfile as sf
from kokoro import KPipeline

script, voices, sections, speed = sys.argv[1], sys.argv[2].split(','), sys.argv[3], float(sys.argv[4])
name = os.path.splitext(os.path.basename(script))[0]
parts = [p.strip() for p in re.split(r'^## .*$', open(script, encoding='utf-8').read(), flags=re.M) if p.strip()]
wanted = range(1, len(parts) + 1) if sections == 'all' else [int(n) for n in sections.split(',')]

pipe = KPipeline(lang_code='a')  # American English
for voice in voices:
    out = f'narration/out/{name}/{voice.strip()}'
    os.makedirs(out, exist_ok=True)
    for n in wanted:
        audio = np.concatenate([a for _, _, a in pipe(parts[n - 1], voice=voice.strip(), speed=speed)])
        wav = f'{out}/{n}.wav'
        sf.write(wav, audio, 24000)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-ac', '1', '-b:a', '128k', f'{out}/{n}.mp3'], check=True)
        os.remove(wav)
        print(f'{out}/{n}.mp3  {len(audio) / 24000:.1f}s')
