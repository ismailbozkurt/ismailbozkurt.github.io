import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;  // Changed from 5173

// Enable CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Serve static files from the dist directory
app.use(express.static('dist'));

// API endpoint to get content structure
app.get('/api/content', async (req, res) => {
  try {
    const contentDir = path.join(__dirname, 'Content');
    const sections = [];
    
    // Read all directories in Content folder
    const dirs = await fs.readdir(contentDir);
    
    for (const dir of dirs) {
      const dirPath = path.join(contentDir, dir);
      const stat = await fs.stat(dirPath);
      
      if (stat.isDirectory()) {
        // Read all files in the directory
        const files = await fs.readdir(dirPath);
        const items = [];
        
        for (const file of files) {
          if (file.endsWith('.md')) {
            const name = path.basename(file, '.md')
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
              
            items.push({
              name,
              path: `/Content/${dir}/${file}`
            });
          }
        }
        
        if (items.length > 0) {
          sections.push({
            title: dir.toUpperCase(),
            items
          });
        }
      }
    }
    
    res.json(sections);
  } catch (error) {
    console.error('Error reading content structure:', error);
    res.status(500).json({ error: 'Failed to read content structure' });
  }
});

// API endpoint to get file content
app.get('/api/file', async (req, res) => {
  try {
    const filePath = path.join(__dirname, req.query.path);
    const contentDir = path.join(__dirname, 'Content');
    if (!filePath.startsWith(contentDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const content = await fs.readFile(filePath, 'utf-8');
    res.type('text/plain').send(content);
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).json({ error: 'Failed to read file', details: error.message });
  }
});

// Handle all other routes by serving index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`API Server running at http://localhost:${port}`);
}); 