import os
import re
import yaml

POSTS_DIR = '../_posts'
TAG_DIR = '.'
TAG_LAYOUT = 'tag_index'

def get_tags_from_post(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    # Extract YAML front matter
    match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not match:
        return []
    front_matter = yaml.safe_load(match.group(1))
    tags = front_matter.get('tags', [])
    if isinstance(tags, str):
        tags = [tags]
    return tags

def main():
    tags = set()
    for fname in os.listdir(POSTS_DIR):
        if fname.endswith('.md'):
            tags.update(get_tags_from_post(os.path.join(POSTS_DIR, fname)))
    os.makedirs(TAG_DIR, exist_ok=True)
    for tag in tags:
        tagfile = os.path.join(TAG_DIR, f'{tag}.md')
        with open(tagfile, 'w', encoding='utf-8') as f:
            f.write(f"---\nlayout: {TAG_LAYOUT}\ntag: {tag}\n---\n")
    print(f"Generated {len(tags)} tag pages.")

if __name__ == '__main__':
    main() 