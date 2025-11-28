import json
import urllib.request
import urllib.error
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Получение данных земельного участка из NSPD по кадастровому номеру
    Args: event с httpMethod, queryStringParameters (cadastralNumber)
    Returns: JSON с количеством точек, площадью, кадастровой стоимостью
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
            'body': ''
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'})
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
            'body': json.dumps({'error': 'cadastralNumber parameter is required'})
        }
    
    normalized_number = cadastral_number.replace(':', ':')
    
    url = f'https://nspd.gov.ru/api/geoportal/v2/search/geoportal?thematicSearchId=1&query={normalized_number}'
    
    try:
        req = urllib.request.Request(url)
        req.add_header('User-Agent', 'Mozilla/5.0')
        
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode('utf-8'))
        
        if not data or 'data' not in data or 'features' not in data['data']:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Участок не найден в NСПД',
                    'cadastralNumber': cadastral_number
                })
            }
        
        features = data['data']['features']
        if not features:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Участок не найден',
                    'cadastralNumber': cadastral_number
                })
            }
        
        feature = features[0]
        geometry = feature.get('geometry', {})
        properties = feature.get('properties', {})
        
        coordinates = geometry.get('coordinates', [])
        points_count = 0
        
        if coordinates and len(coordinates) > 0:
            if isinstance(coordinates[0], list) and len(coordinates[0]) > 0:
                if isinstance(coordinates[0][0], list):
                    points_count = len(coordinates[0][0])
                else:
                    points_count = len(coordinates[0])
        
        area = properties.get('area', 0)
        cadastral_cost = properties.get('cadastralCost', 0)
        category = properties.get('category', '')
        address = properties.get('address', '')
        
        result = {
            'cadastralNumber': cadastral_number,
            'pointsCount': points_count,
            'area': area,
            'cadastralCost': cadastral_cost,
            'category': category,
            'address': address
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
        return {
            'statusCode': e.code,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': f'NSPD API error: {e.code}',
                'cadastralNumber': cadastral_number
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e),
                'cadastralNumber': cadastral_number
            })
        }
