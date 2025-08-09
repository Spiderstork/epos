import json
import csv
import os

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
