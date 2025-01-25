# Adding New Content to the Blog

This guide explains how to add new content to the blog.

## Steps

1. **Create Your Content File**

   - Create a new `.md` file in the appropriate directory under `/Content`
   - Example directories:
     - `/Content/Intro/` for introduction pages
     - `/Content/Code Pieces/` for code-related content
     - `/Content/Projects/` for project documentation
     - `/Content/Vulnerability Research/` for security research

2. **Write Your Content**

   - Use Markdown format
   - Start with a level 2 heading (##) for the title
   - Include appropriate sections and subsections
   - Add code blocks, lists, and other markdown elements as needed

3. **Update the Sidebar Configuration**

   - Open `src/App.tsx`
   - Find the `sections` array in the `Sidebar` component
   - Add your new file to the appropriate section:

   ```javascript
   {
     title: "SECTION_NAME",
     items: [
       {
         name: "Display Name",
         path: "/Content/Section Name/your-file.md"
       }
     ]
   }
   ```

4. **Commit and Push**

   - Add your new markdown file: `git add Content/your-section/your-file.md`
   - Add the updated App.tsx: `git add src/App.tsx`
   - Commit your changes: `git commit -m "Add new content: Your Title"`
   - Push to GitHub: `git push`

5. **Verify**
   - Wait for GitHub Actions to complete the deployment
   - Visit your blog and check that:
     - The new content appears in the sidebar
     - Clicking the link loads your content
     - All formatting appears correctly

## Example

Adding a new vulnerability research article:

1. Create file: `/Content/Vulnerability Research/buffer-overflow.md`
2. Write your content in markdown
3. Update `src/App.tsx`:
   ```javascript
   {
     title: "VULNERABILITY RESEARCH",
     items: [
       // ... existing items ...
       {
         name: "Buffer Overflow Analysis",
         path: "/Content/Vulnerability Research/buffer-overflow.md"
       }
     ]
   }
   ```
4. Commit and push
5. Verify on the live site

## Tips

- Use descriptive file names with dashes for spaces
- Keep the file path structure consistent
- Preview your markdown locally before committing
- Make sure images (if any) are properly referenced
- Test links and code blocks before pushing
