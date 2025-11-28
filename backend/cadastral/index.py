import json
import urllib.request
import urllib.error
import ssl
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Получение данных земельного участка из публичной кадастровой карты
    Args: event с httpMethod, queryStringParameters (cadastralNumber)
    Returns: JSON с количеством точек, площадью участка
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    params = event.get('queryStringParameters', {})
    cadastral_number = params.get('cadastralNumber', '')
    
    if not cadastral_number:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Укажите кадастровый номер'}),
            'isBase64Encoded': False
        }
    
    try:
        url = f'https://pkk.rosreestr.ru/api/features/1/{cadastral_number}'
        
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        
        req = urllib.request.Request(url)
        req.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
        req.add_header('Accept', 'application/json')
        req.add_header('Referer', 'https://pkk.rosreestr.ru/')
        
        with urllib.request.urlopen(req, timeout=15, context=ctx) as response:
            data = json.loads(response.read().decode('utf-8'))
        
        if not data or 'feature' not in data:
            points_count = _estimate_points(cadastral_number)
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({
                    'cadastralNumber': cadastral_number,
                    'pointsCount': points_count,
                    'area': 0,
                    'cadastralCost': 0,
                    'category': '',
                    'address': '',
                    'estimated': True
                }, ensure_ascii=False)
            }
        
        feature = data['feature']
        attrs = feature.get('attrs', {})
        
        coordinates = []
        if 'extent' in feature:
            extent = feature['extent']
            coordinates = extent.get('coordinates', [])
        
        points_count = 0
        if coordinates and len(coordinates) > 0:
            if isinstance(coordinates[0], list):
                if len(coordinates[0]) > 0 and isinstance(coordinates[0][0], list):
                    points_count = len(coordinates[0][0])
                else:
                    points_count = len(coordinates[0])
        
        if points_count == 0:
            points_count = _estimate_points(cadastral_number)
        
        area = float(attrs.get('area_value', 0)) if attrs.get('area_value') else 0
        cadastral_cost = float(attrs.get('cad_cost', 0)) if attrs.get('cad_cost') else 0
        category = attrs.get('category_type', '')
        address = attrs.get('address', '')
        
        result = {
            'cadastralNumber': cadastral_number,
            'pointsCount': points_count,
            'area': area,
            'cadastralCost': cadastral_cost,
            'category': category,
            'address': address,
            'estimated': False
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps(result, ensure_ascii=False)
        }
        
    except urllib.error.HTTPError as e:
        points_count = _estimate_points(cadastral_number)
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                'cadastralNumber': cadastral_number,
                'pointsCount': points_count,
                'area': 0,
                'cadastralCost': 0,
                'category': '',
                'address': '',
                'estimated': True
            }, ensure_ascii=False)
        }
    except Exception as e:
        points_count = _estimate_points(cadastral_number)
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                'cadastralNumber': cadastral_number,
                'pointsCount': points_count,
                'area': 0,
                'cadastralCost': 0,
                'category': '',
                'address': f'Данные временно недоступны',
                'estimated': True,
                'error': str(e)
            }, ensure_ascii=False)
        }

def _estimate_points(cadastral_number: str) -> int:
    '''Оценка количества точек на основе кадастрового номера'''
    parts = cadastral_number.split(':')
    if len(parts) >= 4:
        last_digit = int(parts[-1][-1]) if parts[-1] and parts[-1][-1].isdigit() else 0
        return 4 + (last_digit % 8) + 4
    return 8
