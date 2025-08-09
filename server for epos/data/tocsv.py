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
