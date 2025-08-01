import express from 'express'
import fs from 'fs'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
console.log("ham")
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

const filePath = path.join(__dirname, 'data/items.json')

app.post('/save-item', (req, res) => {
    const { barcode, name, price, category } = req.body;
  
    const newItem = {
      barcode,
      name,
      price: parseFloat(price),
      category: category || null  // optional category
    };
  
    fs.readFile(filePath, 'utf8', (err, data) => {
      let items = [];
  
      if (!err) {
        try {
          items = JSON.parse(data);
          if (!Array.isArray(items)) items = [];
        } catch {
          items = [];
        }
      }

      const existingItem = items.find(i => i.barcode === newItem.barcode)
      if (existingItem) {
        return res.status(400).json({ error: `Item with barcode already exists: ${existingItem.name}` })
      }

      items.push(newItem);
  
      fs.writeFile(filePath, JSON.stringify(items, null, 2), (err) => {
        if (err) {
          console.error('Write error:', err);
          return res.status(500).send('Failed to save item.');
        }
        res.send('Item appended successfully.');
      });
    });
  });
  
app.get('/api/items', (req, res) => {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Read error:', err)
      return res.status(500).json({ error: 'Failed to read items.' })
    }

    try {
      const items = JSON.parse(data)
      res.json(items)
    } catch (parseErr) {
      console.error('Parse error:', parseErr)
      res.status(500).json({ error: 'Invalid items data format.' })
    }
  })
})
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
