import express from 'express';
import fs from 'fs';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const itemsFilePath = path.join(__dirname, 'data/items.json');
const purchasesFilePath = path.join(__dirname, 'data/purchases.json');
const salesFilePath = path.join(__dirname, 'data/sales.json');
import dotenv from 'dotenv';
dotenv.config();

// Very simple password check
function passwordProtect(req, res, next) {
  const password = req.headers['x-app-password'];
  if (password && password === process.env.APP_PASSWORD) {
    next(); // Password correct → move to route
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
app.use(passwordProtect);
console.log('Password from env:', process.env.APP_PASSWORD);
/* ---------------- Utility Functions ---------------- */
function readJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function findItemByBarcode(barcode, items) {
  return items.find(i => i.barcodes.includes(barcode));
}

/* ---------------- Save Item (First-Time Purchase) ---------------- */
app.post('/save-item', (req, res) => {
  const { barcode, barcodes, name, price, quantity_in_stock, cost_per_unit, category } = req.body;

  if (!barcode && (!barcodes || !Array.isArray(barcodes) || barcodes.length === 0)) {
    return res.status(400).json({ error: 'At least one barcode is required.' });
  }

  const items = readJSON(itemsFilePath);

  const newBarcodes = barcodes && Array.isArray(barcodes) ? barcodes : [barcode];

  // Prevent duplicates & tell which item it belongs to
  const conflictItem = items.find(i =>
    i.barcodes.some(existingB => newBarcodes.includes(existingB))
  );

  if (conflictItem) {
    return res.status(400).json({
      error: `Barcode already exists for item: "${conflictItem.name}"`
    });
  }

  const newItem = {
    id: uuidv4(),
    barcodes: newBarcodes,
    name,
    price: parseFloat(price),
    quantity_in_stock: parseInt(quantity_in_stock) || 0,
    category: category || null
  };

  items.push(newItem);
  writeJSON(itemsFilePath, items);

  // Log initial purchase if stock > 0
  const purchases = readJSON(purchasesFilePath);
  if (newItem.quantity_in_stock > 0) {
    purchases.push({
      id: newItem.id,
      barcode: newBarcodes[0],
      name: newItem.name,
      quantity: newItem.quantity_in_stock,
      unit_price: parseFloat(cost_per_unit) || 0,
      purchaseDate: new Date().toISOString(),
      type: 'initial'
    });
    writeJSON(purchasesFilePath, purchases);
  }

  res.send('Item and purchase record saved successfully.');
});

/* ---------------- Add Stock to Existing Item ---------------- */
app.post('/add_stock', (req, res) => {
  const { id, quantity_added, unit_price } = req.body;

  const parsedQuantity = parseInt(quantity_added, 10);
  const parsedPrice = parseFloat(unit_price);

  if (!id || isNaN(parsedQuantity) || parsedQuantity <= 0 || isNaN(parsedPrice) || parsedPrice <= 0) {
    return res.status(400).json({ error: 'Invalid stock or unit price input.' });
  }

  const items = readJSON(itemsFilePath);
  const item = items.find(i => i.id === id);
  if (!item) return res.status(404).json({ error: 'Item not found.' });

  // Update stock
  item.quantity_in_stock = (item.quantity_in_stock || 0) + parsedQuantity;
  writeJSON(itemsFilePath, items);

  // Log stock addition
  const purchases = readJSON(purchasesFilePath);
  purchases.push({
    id: item.id,
    barcode: item.barcodes ? item.barcodes[0] : null, // optional
    name: item.name,
    quantity: parsedQuantity,
    unit_price: parsedPrice,
    purchaseDate: new Date().toISOString(),
    type: 'stock-add'
  });
  writeJSON(purchasesFilePath, purchases);

  res.json({
    success: true,
    newStock: item.quantity_in_stock
  });
});


/* ---------------- Save a Sale ---------------- */
app.post('/api/sales', (req, res) => {
  const sale = req.body;

  if (
    !sale.timestamp ||
    !sale.items ||
    !Array.isArray(sale.items) ||
    sale.items.length === 0 ||
    typeof sale.total !== 'number' ||
    !sale.payment_type ||
    (sale.payment_type === 'cash' && (typeof sale.payment_received !== 'number' || sale.payment_received < sale.total))
  ) {
    return res.status(400).json({ error: 'Invalid sale data' });
  }

  const itemsList = readJSON(itemsFilePath);
  const warnings = [];

  for (const soldItem of sale.items) {
    const item = findItemByBarcode(soldItem.barcode, itemsList);
    if (!item) {
      warnings.push(`Item not found: ${soldItem.name} (barcode: ${soldItem.barcode})`);
      continue;
    }
    if ((item.quantity_in_stock || 0) < soldItem.quantity) {
      warnings.push(`Insufficient stock for item: ${soldItem.name}. Stock not decreased.`);
      continue;
    }
    item.quantity_in_stock -= soldItem.quantity;
    soldItem.id = item.id; // Attach ID to sale record
  }

  writeJSON(itemsFilePath, itemsList);

  const sales = readJSON(salesFilePath);
  sales.push(sale);
  writeJSON(salesFilePath, sales);

  res.status(201).json({
    message: 'Sale saved successfully',
    warnings: warnings.length > 0 ? warnings : undefined
  });
});

app.post('/update_item', (req, res) => {
  const updatedData = req.body;
  const { id, barcodes } = updatedData;

  if (!id) {
    return res.status(400).json({ error: 'Item id is required.' });
  }

  const items = readJSON(itemsFilePath);
  const index = items.findIndex(i => i.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Item not found.' });
  }

  // Validate barcodes to prevent conflicts with other items
  if (barcodes) {
    // Flatten all barcodes except for current item
    const otherBarcodes = items
      .filter(i => i.id !== id)
      .flatMap(i => i.barcodes);

    for (const bc of barcodes) {
      if (otherBarcodes.includes(bc)) {
        return res.status(400).json({
          error: `Barcode "${bc}" already exists for another item.`
        });
      }
    }
  }

  // Merge updated fields
  items[index] = {
    ...items[index],
    ...updatedData
  };

  writeJSON(itemsFilePath, items);

  res.json({ success: true, item: items[index] });
});



/* ---------------- Fetch All Items ---------------- */
app.get('/api/items', (req, res) => {
  res.json(readJSON(itemsFilePath));
});

app.use('/data', express.static(path.join(__dirname, 'data')));

/* ---------------- Start Server ---------------- */
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
