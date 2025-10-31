from flask import Blueprint, request, jsonify
from marshmallow import ValidationError
from datetime import datetime
from api.schemas import track_visitor_schema
from api.storage import storage
import time

api_bp = Blueprint('api', __name__, url_prefix='/api')

@api_bp.route('/visitors/track', methods=['POST', 'OPTIONS'])
def track_visitor():
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        start_time = time.time()
        
        content_type = request.content_type
        if content_type and 'text/plain' in content_type:
            import json
            body = json.loads(request.data.decode('utf-8'))
        else:
            body = request.get_json()
        
        validated_data = track_visitor_schema.load(body)
        
        ip = validated_data.get('ip') or request.remote_addr or 'unknown'
        user_agent = validated_data.get('userAgent') or request.headers.get('User-Agent') or 'unknown'
        
        visitor = storage.track_visitor({
            'userId': validated_data.get('userId'),
            'page': validated_data['page'],
            'referrer': validated_data.get('referrer'),
            'userAgent': user_agent,
            'ip': ip
        })
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return jsonify({
            'status': 'success',
            'message': 'Visitor tracked successfully',
            'visitor_id': visitor['id'],
            'metadata': {
                'processing_time': f'{processing_time}ms'
            }
        }), 200
        
    except ValidationError as err:
        return jsonify({
            'status': 'error',
            'message': 'Invalid request data',
            'errors': err.messages
        }), 400
    except Exception as e:
        print(f"Error tracking visitor: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Internal server error'
        }), 500

@api_bp.route('/visitors/count', methods=['GET'])
def get_visitor_counts():
    try:
        start_time = time.time()
        period = request.args.get('period')
        
        valid_periods = ['today', 'week', 'month', 'year', 'all']
        if period and period not in valid_periods:
            return jsonify({
                'status': 'error',
                'message': 'Invalid period parameter. Must be one of: today, week, month, year, all'
            }), 400
        
        requested_period = None if period == 'all' else period
        counts = storage.get_visitor_counts(requested_period)
        processing_time = int((time.time() - start_time) * 1000)
        
        return jsonify({
            'status': 'success',
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'data': counts,
            'metadata': {
                'endpoint': '/api/visitors/count',
                'period': period or 'all',
                'processing_time': f'{processing_time}ms'
            }
        }), 200
        
    except Exception as e:
        print(f"Error getting visitor counts: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Internal server error'
        }), 500

@api_bp.route('/visitors/all', methods=['GET'])
def get_all_visitors():
    try:
        visitors = storage.get_all_visitors()
        return jsonify({
            'status': 'success',
            'data': visitors,
            'count': len(visitors)
        }), 200
    except Exception as e:
        print(f"Error getting all visitors: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Internal server error'
        }), 500
