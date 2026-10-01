import os
import re

replacements = {
    'â€"': '—',
    'â€™': '’',
    'â€œ': '"',
    'â€': '"',
    'â€¢': '•',
    'â€¦': '…',
    'Â·': '·',
    'â†’': '→',
    'â€“': '–',
    'â€ ': '"',
    'â€¡': '¡',
    'â€¢': '•',
    'â€˜': '‘',
    'â€š': '‚',
    'â€ž': '„',
    'â€¡': '†',
    'â€¢': '‡',
    'Ëœ': 'ˆ',
    'â€°': '‰',
    'Å ': 'Š',
    'â€¹': '‹',
    'Å¾': 'Œ',
    'Ã¡': 'á',
    'Ã©': 'é',
    'Ã­': 'í',
    'Ã³': 'ó',
    'Ãº': 'ú',
    'Ã±': 'ñ',
    'Ã¼': 'ü',
}

# Fix emoji corruption
emoji_fixes = {
    'ðŸ›’': '🛒',
    'ðŸ“…': '📅',
    'ðŸ’¬': '💬',
    'ðŸ”': '🔍',
    'ðŸ': '',
}

for root, dirs, files in os.walk('src'):
    for f in files:
        if f.endswith(('.astro', '.tsx', '.ts', '.mjs', '.js', '.json')):
            path = os.path.join(root, f)
            try:
                with open(path, 'r', encoding='utf-8') as fp:
                    content = fp.read()
                original = content
                for old, new in replacements.items():
                    content = content.replace(old, new)
                for old, new in emoji_fixes.items():
                    content = content.replace(old, new)
                if content != original:
                    with open(path, 'w', encoding='utf-8', newline='') as fp:
                        fp.write(content)
                    print(f'Fixed {path}')
            except Exception as e:
                print(f'Error {path}: {e}')

for root, dirs, files in os.walk('api'):
    for f in files:
        if f.endswith(('.ts', '.js')):
            path = os.path.join(root, f)
            try:
                with open(path, 'r', encoding='utf-8') as fp:
                    content = fp.read()
                original = content
                for old, new in replacements.items():
                    content = content.replace(old, new)
                for old, new in emoji_fixes.items():
                    content = content.replace(old, new)
                if content != original:
                    with open(path, 'w', encoding='utf-8', newline='') as fp:
                        fp.write(content)
                    print(f'Fixed {path}')
            except Exception as e:
                print(f'Error {path}: {e}')

print("Done fixing encoding")