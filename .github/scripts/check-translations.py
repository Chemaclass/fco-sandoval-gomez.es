"""Check ES/EN/IT coverage and preserved facts/assets (Python 3.11+).

This checks structural consistency, not the linguistic accuracy of a translation.
"""
from collections import Counter
from pathlib import Path
import re
import tomllib

ROOT = Path(__file__).resolve().parents[2]


def read_page(path):
    _, frontmatter, body = path.read_text().split('+++', 2)
    return tomllib.loads(frontmatter), body.strip()


def protected_tokens(body):
    # External URLs, relative media paths, and shortcode arguments are immutable.
    return Counter(re.findall(
        r'https?://[^\s\)"<>]+|/?images/[^\s\)"<>]+|\{%.*?%\}|\{\{.*?\}\}', body))


def check():
    config = tomllib.loads((ROOT / 'config.toml').read_text())
    dictionaries = config['extra']['i18n']
    for language in ('en', 'it'):
        assert dictionaries[language].keys() == dictionaries['es'].keys(), f'{language}: UI keys differ'
    for language, dictionary in dictionaries.items():
        assert all(dictionary.values()), f'{language}: empty UI translation'
        assert len(dictionary['months']) == 12, f'{language}: missing month names'

    count = 0
    for source in sorted((ROOT / 'content').rglob('*.md')):
        if source.name.endswith(('.en.md', '.it.md')) or source.name == '_draft.md':
            continue
        fields, body = read_page(source)
        if fields.get('draft'):
            continue
        for language in ('en', 'it'):
            target = source.with_suffix(f'.{language}.md')
            assert target.exists(), f'Missing translation: {target}'
            translated, translated_body = read_page(target)
            assert not translated.get('draft'), f'{target}: published source has draft translation'
            for field in ('title', 'description'):
                assert bool(fields.get(field)) == bool(translated.get(field)), f'{target}: missing {field}'
            for field in ('date', 'updated', 'template', 'sort_by', 'paginate_by', 'in_search_index'):
                assert fields.get(field) == translated.get(field), f'{target}: changed {field}'
            for field in ('image', 'year', 'coauthors', 'original_title', 'source', 'url', 'youtube'):
                assert fields.get('extra', {}).get(field) == translated.get('extra', {}).get(field), f'{target}: changed {field}'
            source_links = fields.get('extra', {}).get('links', [])
            target_links = translated.get('extra', {}).get('links', [])
            assert [link['url'] for link in source_links] == [link['url'] for link in target_links], f'{target}: changed research links'
            assert bool(body) == bool(translated_body), f'{target}: missing or unexpected body'
            assert protected_tokens(body) == protected_tokens(translated_body), f'{target}: changed URLs, media or shortcodes'
            assert not re.search(r'\[(images remain|immagin[ie] come)', translated_body), f'{target}: placeholder content'
            count += 1
    for target in (ROOT / 'content').rglob('*.md'):
        if target.name.endswith(('.en.md', '.it.md')):
            source = target.with_name(target.name[:-6] + '.md')
            assert source.exists(), f'Orphan translation: {target}'
    print(f'Translation coverage and structural consistency passed: {count} translations, 3 UI dictionaries')


if __name__ == '__main__':
    check()
