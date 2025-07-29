# .github/actions/app/generate_posts.py
import os

BLOG_DIR = "content/blog"
OUTPUT_FILE = "content/pages/posts.md"

FRONT_MATTER = """+++
title="📝 Posts"
description="List of posts"
path="posts"
sort_by="date"
+++

# All Posts

"""

with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
    out.write(FRONT_MATTER)
    for root, _, files in os.walk(BLOG_DIR):
        for file in sorted(files):
            if file.endswith(".md") and file != "_index.md":
                relative_path = os.path.join(root, file).replace("\\", "/")
                title = file.replace(".md", "").replace("-", " ").title()
                out.write(f"- [{title}]({relative_path})\n")
