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

// API endpoint to get content
app.get('/api/content', async (req, res) => {
  const contentDir = path.join(__dirname, 'Content');
  const sections = [];

  try {
    const dirs = await fs.readdir(contentDir);
    console.log('Found directories:', dirs);
    
    for (const dir of dirs) {
      const dirPath = path.join(contentDir, dir);
      const stat = await fs.stat(dirPath);
      
      if (stat.isDirectory()) {
        const files = await fs.readdir(dirPath);
        console.log(`Files in ${dir}:`, files);
        
        const items = await Promise.all(
          files.map(async (file) => {
            const filePath = path.join(dirPath, file);
            const relativePath = path.relative(__dirname, filePath);
            return {
              name: path.parse(file).name,
              path: '/' + relativePath.replace(/\\/g, '/'),
            };
          })
        );

        sections.push({
          title: dir.toUpperCase(),
          items,
        });
      }
    }

    console.log('Sending sections:', sections);
    res.json(sections);
  } catch (error) {
    console.error('Error reading content:', error);
    res.status(500).json({ error: 'Failed to read content', details: error.message });
  }
});

// API endpoint to get file content
app.get('/api/file', async (req, res) => {
  try {
    const filePath = path.join(__dirname, req.query.path);
    
    // Security check to ensure the file is within the Content directory
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

app.listen(port, () => {
  console.log(`API Server running at http://localhost:${port}`);
}); 