import os
import re

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
                # Full relative path
                relative_path = os.path.join(root, file).replace("\\", "/")

                # Remove 'content/' and '.md'
                path_without_ext = relative_path.replace("content/", "").replace(".md", "")

                # Split path into directory + filename
                path_parts = path_without_ext.split("/")
                filename_slug = path_parts[-1]

                # Remove leading YYYY-MM-DD- from filename
                clean_slug = re.sub(r"^\d{4}-\d{2}-\d{2}-", "", filename_slug).lower()

                # Reconstruct cleaned Zola URL
                path_parts[-1] = clean_slug
                zola_url = "/" + "/".join(path_parts) + "/"

                # Prettify display title
                title = clean_slug.replace("-", " ").title()

                out.write(f"- [{title}]({zola_url})\n")
