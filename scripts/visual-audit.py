#!/usr/bin/env python3
"""Produce OCR review evidence from a completed fixture browser run, not a parity verdict."""
import hashlib
import json
from pathlib import Path
import shutil
import struct
import subprocess


def main():
    manifest = json.loads(Path('/tmp/flexsca-visual-manifest.json').read_text())
    if not manifest.get('completed') or len(manifest.get('captures', [])) != 6:
        raise SystemExit('Run npm run test:browser successfully before the visual audit.')
    if not shutil.which('tesseract'):
        raise SystemExit('Install Tesseract with English language data before OCR review.')
    output = Path('/tmp/flexsca-visual-audit')
    output.mkdir(exist_ok=True)
    entries = []
    for item in manifest['captures']:
        image = Path(item['path'])
        pixels = image.read_bytes()
        if hashlib.sha256(pixels).hexdigest() != item['sha256']:
            raise SystemExit(f'Capture changed after browser validation: {image.name}')
        if pixels[:8] != b'\x89PNG\r\n\x1a\n':
            raise SystemExit(f'Invalid PNG capture: {image.name}')
        width, height = struct.unpack('>II', pixels[16:24])
        ocr = subprocess.run(['tesseract', str(image), 'stdout', '-l', 'eng', 'quiet'], check=True, capture_output=True, text=True, timeout=60).stdout
        shutil.copyfile(image, output / image.name)
        (output / f'{image.stem}.dom.txt').write_text(item['text'])
        (output / f'{image.stem}.ocr.txt').write_text(ocr)
        entries.append({**item, 'image': image.name, 'imageDimensions': {'width': width, 'height': height}, 'ocrText': ocr})
    report = {'fixtureData': True, 'figmaInspected': False, 'pixelParityVerified': False,
              'notes': 'Review images, exact DOM text and imperfect OCR together. Fixed/sticky navigation in full-page captures appears at its viewport position. No Figma baseline is available.',
              'captures': entries}
    (output / 'report.json').write_text(json.dumps(report, indent=2))
    shutil.make_archive('/tmp/flexsca-visual-audit', 'zip', output)
    print(f'Prepared {len(entries)} image/DOM/OCR evidence sets: {output}/report.json')


if __name__ == '__main__':
    main()
