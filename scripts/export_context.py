#!/usr/bin/env python3
"""Create a single, deterministic Markdown context snapshot for teammates' AI."""
from pathlib import Path
import hashlib
import sys

ROOT = Path(__file__).resolve().parents[1]
CHANGE = ROOT / 'openspec/changes/build-rwa-income-rights'
paths = [ROOT/'README.md', ROOT/'AGENTS.md', ROOT/'docs/product.md',
         ROOT/'docs/spec/decisions.md', ROOT/'openspec/config.yaml',
         CHANGE/'proposal.md', CHANGE/'design.md']
paths += [ROOT/'docs/development.md'] if (ROOT/'docs/development.md').exists() else []
paths += sorted((CHANGE/'specs').glob('*/spec.md'))
paths += [p for p in sorted((ROOT/'docs/spec').glob('*.md')) if p.name != 'decisions.md']
paths += sorted((ROOT/'schemas').glob('*.json'))
paths += sorted((ROOT/'examples').glob('*.json'))
paths += [CHANGE/'tasks.md']
assert len(paths) == len(set(paths)), 'Duplicate bundle source'
for p in paths:
    assert p.is_file(), f'Missing source {p}'
digest = hashlib.sha256()
manifest = []
for p in paths:
    relative = str(p.relative_to(ROOT))
    content = p.read_bytes()
    sha = hashlib.sha256(content).hexdigest()
    digest.update(relative.encode()+b'\0'+content+b'\0')
    manifest.append((relative, sha))
out = [
    '# RWA Income Rights — Shared AI Context',
    '',
    '**GENERATED SNAPSHOT — jangan edit langsung. Baca status starter dan task; fitur produk belum lengkap.**',
    'Tanggal baseline: 8 Oktober 2026. Gunakan revisi repo terbaru bila berbeda dengan file ini.',
    'Sumber asli, urutan bagian, dan SHA-256 tercantum di bawah. Link relatif di bagian dokumen mengacu ke lokasi file asal dalam repo.',
    'File ini menyertakan kontrak data dan fixtures; beberapa fixture sengaja invalid untuk pengujian. Jangan menganggap fixture sebagai transaksi/provider data nyata.',
    'UI visual mengikuti desainer tim. Jobdesk ditentukan saat meet. Jangan menambah swap execution/NFT/training ML di luar scope.',
    '', f'Bundle source digest: `{digest.hexdigest()}`', '',
    '## Source Manifest', '', '| Source | SHA-256 |', '| --- | --- |'
]
out += [f'| `{name}` | `{sha}` |' for name, sha in manifest]
for p in paths:
    name = str(p.relative_to(ROOT))
    out.extend(['', '---', '', f'# Source: {name}', ''])
    if p.suffix in {'.json', '.yaml'}:
        out.extend(['````'+('json' if p.suffix == '.json' else 'yaml'), p.read_text().rstrip(), '````'])
    else:
        out.append(p.read_text().rstrip())
target = ROOT/'docs/TEAM-CONTEXT.md'
content = '\n'.join(out)+'\n'
if '--check' in sys.argv:
    if not target.exists() or target.read_text() != content:
        raise SystemExit('TEAM-CONTEXT.md drift: run pnpm generate (or python3 scripts/export_context.py)')
    print(f'Checked {len(paths)} context sources; digest={digest.hexdigest()}')
else:
    target.write_text(content)
    print(f'Exported {len(paths)} sources, {target.stat().st_size} bytes; digest={digest.hexdigest()}')
