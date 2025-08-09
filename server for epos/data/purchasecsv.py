import json
import csv
import os

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
