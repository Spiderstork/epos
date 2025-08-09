import express from 'express'
import fs from 'fs'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3000
// felt wrong without it
console.log("Ham")
app.use(cors())
app.use(express.json())

const itemsFilePath = path.join(__dirname, 'data/items.json')
const purchasesFilePath = path.join(__dirname, 'data/purchases.json')

/* ---------------- Save Item (First-Time Purchase) ---------------- */
app.post('/save-item', (req, res) => {
  const { barcode, name, price, quantity_in_stock, cost_per_unit, category } = req.body

  const newItem = {
    barcode,
    name,
    price: parseFloat(price),
    quantity_in_stock: parseInt(quantity_in_stock) || 0,
    category: category || null
  }

  fs.readFile(itemsFilePath, 'utf8', (err, data) => {
    let items = []

    if (!err) {
      try {
        items = JSON.parse(data)
        if (!Array.isArray(items)) items = []
      } catch {
        items = []
      }
    }

    const existingItem = items.find(i => i.barcode === newItem.barcode)
    if (existingItem) {
      return res.status(400).json({ error: `Item with barcode already exists: ${existingItem.name}` })
    }

    items.push(newItem)

    fs.writeFile(itemsFilePath, JSON.stringify(items, null, 2), (writeErr) => {
      if (writeErr) {
        console.error('Write error:', writeErr)
        return res.status(500).send('Failed to save item.')
      }

      // Add initial purchase record (if stock > 0)
      const purchaseRecord = {
        barcode: newItem.barcode,
        name: newItem.name,
        quantity: newItem.quantity_in_stock,
        unit_price: parseFloat(cost_per_unit) || 0,
        purchaseDate: new Date().toISOString(),
        type: 'initial'
      }

      fs.readFile(purchasesFilePath, 'utf8', (pErr, pData) => {
        let purchases = []

        if (!pErr) {
          try {
            purchases = JSON.parse(pData)
            if (!Array.isArray(purchases)) purchases = []
          } catch {
            purchases = []
          }
        }

        if (newItem.quantity_in_stock > 0) {
          purchases.push(purchaseRecord)
        }

        fs.writeFile(purchasesFilePath, JSON.stringify(purchases, null, 2), (pWriteErr) => {
          if (pWriteErr) {
            console.error('Purchase write error:', pWriteErr)
            return res.status(500).send('Failed to save purchase record.')
          }

          res.send('Item and purchase record saved successfully.')
        })
      })
    })
  })
})

/* ---------------- Add Stock to Existing Item ---------------- */
app.post('/add_stock', (req, res) => {
  console.log('REQUEST BODY:', req.body)

  const { barcode, quantity_added, unit_price } = req.body

  const parsedQuantity = parseInt(quantity_added, 10)
  const parsedPrice = parseFloat(unit_price)

  // Validation
  if (
    !barcode ||
    isNaN(parsedQuantity) || parsedQuantity <= 0 ||
    isNaN(parsedPrice) || parsedPrice <= 0
  ) {
    return res.status(400).json({ error: 'Invalid stock or unit price input.' })
  }

  fs.readFile(itemsFilePath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read items.' })

    let items
    try {
      items = JSON.parse(data)
      if (!Array.isArray(items)) items = []
    } catch {
      return res.status(500).json({ error: 'Invalid items data format.' })
    }

    const item = items.find(i => i.barcode === barcode)
    if (!item) return res.status(404).json({ error: 'Item not found.' })

    // Update stock
    item.quantity_in_stock = (item.quantity_in_stock || 0) + parsedQuantity

    fs.writeFile(itemsFilePath, JSON.stringify(items, null, 2), err => {
      if (err) return res.status(500).json({ error: 'Failed to update stock.' })

      const record = {
        barcode: item.barcode,
        name: item.name,
        quantity: parsedQuantity,
        unit_price: parsedPrice,
        purchaseDate: new Date().toISOString(),
        type: 'stock-add'
      }

      fs.readFile(purchasesFilePath, 'utf8', (pErr, pData) => {
        let purchases = []
        if (!pErr) {
          try {
            purchases = JSON.parse(pData)
            if (!Array.isArray(purchases)) purchases = []
          } catch {
            purchases = []
          }
        }

        purchases.push(record)

        fs.writeFile(purchasesFilePath, JSON.stringify(purchases, null, 2), pWriteErr => {
          if (pWriteErr) {
            console.error('Error writing purchase record:', pWriteErr)
            // Still return success even if logging failed
          }

          res.json({
            success: true,
            newStock: item.quantity_in_stock,
            purchase: record
          })
        })
      })
    })
  })
})

const salesFilePath = path.join(__dirname, 'data/sales.json')

/* ---------------- Save a Sale ---------------- */
app.post('/api/sales', (req, res) => {
  const sale = req.body

  // Basic validation (same as before)
  if (
    !sale.timestamp ||
    !sale.items ||
    !Array.isArray(sale.items) ||
    sale.items.length === 0 ||
    typeof sale.total !== 'number' ||
    !sale.payment_type ||
    (sale.payment_type === 'cash' && (typeof sale.payment_received !== 'number' || sale.payment_received < sale.total))
  ) {
    return res.status(400).json({ error: 'Invalid sale data' })
  }

  fs.readFile(itemsFilePath, 'utf8', (itemsErr, itemsData) => {
    if (itemsErr) {
      console.error('Failed to read items:', itemsErr)
      return res.status(500).json({ error: 'Failed to read items' })
    }

    let itemsList = []
    try {
      itemsList = JSON.parse(itemsData)
      if (!Array.isArray(itemsList)) itemsList = []
    } catch {
      return res.status(500).json({ error: 'Invalid items data format.' })
    }

    const warnings = []

    // For each sold item, try to decrease stock if available
    for (const soldItem of sale.items) {
      const item = itemsList.find(i => i.barcode === soldItem.barcode)
      if (!item) {
        warnings.push(`Item not found: ${soldItem.name} (barcode: ${soldItem.barcode})`)
        continue
      }
      if ((item.quantity_in_stock || 0) < soldItem.quantity) {
        warnings.push(`Insufficient stock for item: ${soldItem.name}. Stock not decreased.`)
        // Do NOT decrease stock in this case
        continue
      }
      // Decrease stock
      item.quantity_in_stock -= soldItem.quantity
    }

    // Write updated items back to items.json
    fs.writeFile(itemsFilePath, JSON.stringify(itemsList, null, 2), (writeItemsErr) => {
      if (writeItemsErr) {
        console.error('Failed to update items stock:', writeItemsErr)
        return res.status(500).json({ error: 'Failed to update items stock.' })
      }

      // Now read existing sales
      fs.readFile(salesFilePath, 'utf8', (salesErr, salesData) => {
        let sales = []
        if (!salesErr) {
          try {
            sales = JSON.parse(salesData)
            if (!Array.isArray(sales)) sales = []
          } catch {
            sales = []
          }
        }

        // Add new sale
        sales.push(sale)

        // Save sales.json
        fs.writeFile(salesFilePath, JSON.stringify(sales, null, 2), (writeSalesErr) => {
          if (writeSalesErr) {
            console.error('Failed to save sale:', writeSalesErr)
            return res.status(500).json({ error: 'Failed to save sale' })
          }

          // Respond success + warnings if any
          const response = {
            message: 'Sale saved successfully',
            warnings: warnings.length > 0 ? warnings : undefined
          }

          res.status(201).json(response)
        })
      })
    })
  })
})



/* ---------------- Fetch All Items ---------------- */
app.get('/api/items', (req, res) => {
  fs.readFile(itemsFilePath, 'utf8', (err, data) => {
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

/* ---------------- Start Server ---------------- */
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
