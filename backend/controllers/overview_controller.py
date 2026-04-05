from flask import Blueprint, jsonify
from decorators import login_required
from services.overview_service import get_overview

overview_bp = Blueprint('overview', __name__)

@overview_bp.route('/api/overview')
@login_required
def api_overview():
    return jsonify(get_overview())