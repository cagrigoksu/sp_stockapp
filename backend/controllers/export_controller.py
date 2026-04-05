import io
from datetime import datetime
from flask import Blueprint, request, jsonify, session, send_file
from decorators import login_required
from services.export_service import build_excel
from services.csv_service import process_csv

export_bp = Blueprint('export', __name__)

@export_bp.route('/api/export/excel')
@login_required
def api_export_excel():
    out = build_excel()
    fname = f"stock_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    return send_file(out, download_name=fname, as_attachment=True,
                     mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

@export_bp.route('/api/upload-csv', methods=['POST'])
@login_required
def api_upload_csv():
    f = request.files.get('file')
    item_type = request.form.get('type')
    if not f:
        return jsonify({'error': 'No file provided'}), 400
    content = f.read().decode('utf-8')
    count, errors = process_csv(content, item_type, session['user_id'])
    return jsonify({'success': True, 'imported': count, 'errors': errors})

@export_bp.route('/api/csv-template/<item_type>')
@login_required
def api_csv_template(item_type):
    templates = {
        'device': (
            'internal_barcode,device_type,brand,model,connector,is_engraved,status,place\n'
            ',phone,Apple,iPhone 15,USB-C,false,Good,Warehouse A\n'
            '260225S42,phone,Apple,iPhone 14,lightning,true,Good,Shelf A\n'
            ',tablet,Samsung,Galaxy Tab S9,USB-C,false,Good,Shelf B\n'
            '260225T7,tablet,Apple,iPad Pro,USB-C,false,Good,Warehouse A'
        ),
        'charger': 'barcode,charger_type,place\n,USB-C,Warehouse A\nABC123,USB-A,Shelf B',
        'cable': 'barcode,cable_type,place\n,USB-C to USB-C,Warehouse A\nABC123,USB-A to Lightning,Shelf B',
    }
    if item_type not in templates:
        return 'Not found', 404
    return send_file(io.BytesIO(templates[item_type].encode()), download_name=f'{item_type}_template.csv',
                     as_attachment=True, mimetype='text/csv')