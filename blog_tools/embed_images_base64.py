import sys
import os
import re
import base64

# Usage: python embed_images_base64.py <input_markdown> <image_dir> <output_markdown>
def image_to_base64(image_path):
    ext = os.path.splitext(image_path)[1].lower()
    mime = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp',
    }.get(ext, 'application/octet-stream')
    with open(image_path, 'rb') as f:
        b64 = base64.b64encode(f.read()).decode('utf-8')
    return f'data:{mime};base64,{b64}'

def main():
    if len(sys.argv) != 4:
        print('Usage: python embed_images_base64.py <input_markdown> <image_dir> <output_markdown>')
        sys.exit(1)
    md_file, img_dir, out_file = sys.argv[1:4]
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()
    # Obsidian-style ![[filename]]
    def obsidian_replacer(match):
        img_name = match.group(1)
        img_path = os.path.join(img_dir, img_name)
        if not os.path.isfile(img_path):
            print(f'Warning: Image not found: {img_path}')
            return match.group(0)
        data_uri = image_to_base64(img_path)
        return f'![]({data_uri})'
    content = re.sub(r'!\[\[(.*?)\]\]', obsidian_replacer, content)
    # Standard markdown ![](/assets/images/HTB-Mirage/filename.png)
    def mdimg_replacer(match):
        img_path_rel = match.group(1)
        img_name = os.path.basename(img_path_rel)
        img_path = os.path.join(img_dir, img_name)
        if not os.path.isfile(img_path):
            print(f'Warning: Image not found: {img_path}')
            return match.group(0)
        data_uri = image_to_base64(img_path)
        return f'![]({data_uri})'
    content = re.sub(r'!\[]\((/assets/images/HTB-Mirage/[^)]+)\)', mdimg_replacer, content)
    # HTML <img src="/assets/images/HTB-Mirage/filename.png" ...>
    def htmlimg_replacer(match):
        before = match.group(1)
        img_path_rel = match.group(2)
        after = match.group(3)
        img_name = os.path.basename(img_path_rel)
        img_path = os.path.join(img_dir, img_name)
        if not os.path.isfile(img_path):
            print(f'Warning: Image not found: {img_path}')
            return match.group(0)
        data_uri = image_to_base64(img_path)
        return f'{before}{data_uri}{after}'
    content = re.sub(r'(<img\s+[^>]*src=")(/assets/images/HTB-Mirage/[^"\s]+)("[^>]*>)', htmlimg_replacer, content)
    with open(out_file, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Output written to {out_file}')

if __name__ == '__main__':
    main() 