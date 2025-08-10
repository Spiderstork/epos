import json
import csv
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
items_path = os.path.join(script_dir, 'items.json')
csv_path = os.path.join(script_dir, 'items.csv')

with open(items_path, 'r', encoding='utf-8') as f:
    items = json.load(f)

with open(csv_path, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['id', 'barcodes', 'name', 'price', 'quantity_in_stock', 'category'])
    for item in items:
        writer.writerow([
            str(item['id']),
            "; ".join(item['barcodes']),
            str(item['name']),
            str(item['price']),
            str(item['quantity_in_stock']),
            str(item.get('category', ''))
        ])

print('CSV saved:', csv_path)


script_dir = os.path.dirname(os.path.abspath(__file__))
purchase_path = os.path.join(script_dir, 'purchases.json')
csv_path = os.path.join(script_dir, 'purchase.csv')

with open(purchase_path, 'r', encoding='utf-8') as f:
    purchases = json.load(f)

with open(csv_path, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    # Header row matching all keys from your JSON objects
    writer.writerow([
        'id',
        'barcode',
        'name',
        'quantity',
        'unit_price',
        'purchaseDate',
        'type'
    ])

    for purchase in purchases:
        writer.writerow([
            purchase.get('id', ''),
            purchase.get('barcode', ''),
            purchase.get('name', ''),
            str(purchase.get('quantity', '')),
            str(purchase.get('unit_price', '')),
            purchase.get('purchaseDate', ''),
            purchase.get('type', '')
        ])

print('Purchase CSV saved:', csv_path)

script_dir = os.path.dirname(os.path.abspath(__file__))
sales_path = os.path.join(script_dir, 'sales.json')
csv_path = os.path.join(script_dir, 'sales.csv')

with open(sales_path, 'r', encoding='utf-8') as f:
    sales = json.load(f)

with open(csv_path, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    # Header row: sale-level + item-level columns
    writer.writerow([
        'timestamp',
        'total',
        'payment_received',
        'payment_type',
        'item_id',
        'item_barcode',
        'item_name',
        'item_quantity',
        'item_unit_price'
    ])
    for sale in sales:
        timestamp = sale.get('timestamp', '')
        total = str(sale.get('total', ''))
        payment_received = str(sale.get('payment_received', ''))
        payment_type = sale.get('payment_type', '')
        for item in sale.get('items', []):
            writer.writerow([
                timestamp,
                total,
                payment_received,
                payment_type,
                str(item.get('id', '')),
                str(item.get('barcode', '') or ''),  # handle null barcode
                str(item.get('name', '')),
                str(item.get('quantity', '')),
                str(item.get('unit_price', ''))
            ])

print('Sales CSV saved:', csv_path)
