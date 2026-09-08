"""Check generated metadata and translation destinations after a Zola build."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, unquote
import json
import sys

class Metadata(HTMLParser):
    def __init__(self):
        super().__init__()
        self.meta, self.alternates, self.blocks = {}, {}, []
        self.in_json = False
        self.in_h1 = False
        self.headings = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'h1':
            self.in_h1 = True
            self.headings.append('')
        if tag == 'meta':
            self.meta[attrs.get('name', attrs.get('property'))] = attrs.get('content')
        if tag == 'link' and 'hreflang' in attrs:
            self.alternates[attrs['hreflang']] = attrs['href']
        if tag == 'script' and attrs.get('type') == 'application/ld+json':
            self.in_json = True
            self.blocks.append('')

    def handle_data(self, data):
        if self.in_h1:
            self.headings[-1] += data
        if self.in_json:
            self.blocks[-1] += data

    def handle_endtag(self, tag):
        if tag == 'h1':
            self.in_h1 = False
        if tag == 'script':
            self.in_json = False

root = Path(sys.argv[1] if len(sys.argv) > 1 else 'public')
parsed = {}
for file in root.rglob('*.html'):
    metadata = Metadata()
    metadata.feed(file.read_text())
    parsed[file] = metadata
    for block in metadata.blocks:
        json.loads(block)

checked = 0
for file, metadata in parsed.items():
    for language, target in metadata.alternates.items():
        url = urlparse(target)
        assert url.scheme in ('http', 'https'), (file, target)
        assert url.netloc == urlparse(metadata.meta['og:url']).netloc, (file, target)
        target_file = root / unquote(url.path.lstrip('/')) / 'index.html'
        assert target_file.exists(), (file, target)
        if language != 'x-default':
            assert metadata.meta['og:url'] in parsed[target_file].alternates.values(), (file, 'non-reciprocal', target)
        checked += 1

# Content can be renamed or removed by its author. Check page invariants,
# rather than requiring a particular article or exact editorial wording.
for file, metadata in parsed.items():
    if metadata.meta.get('og:type') == 'article':
        assert metadata.headings, (file, 'missing article heading')
        assert metadata.meta['og:title'] == metadata.headings[0].strip(), (file, 'generic sharing title')
        assert metadata.meta['twitter:title'] == metadata.meta['og:title'], (file, 'inconsistent sharing title')
        assert metadata.meta.get('description'), (file, 'missing description')
print(f'Checked {len(parsed)} HTML files, JSON-LD, {checked} alternate links and article metadata.')
