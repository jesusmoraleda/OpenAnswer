from datetime import datetime, timedelta
from flask import jsonify, request, Response
from flask_login import login_required
from flask_socketio import emit
from app.utils.decorators.admin import admin_required, admin_or_localhost_required
from app.utils.utils import get_remote_addr
from app import models

from . import api


MESSAGES_PER_PAGE = 75


@api.route('/messages/<room>', methods=['GET'])
@api.route('/messages/<room>/<int:page>', methods=['GET'])
@login_required
# Pages are in reverse (1 being the most recent).
def get_messages(room, page=1):
    oldest = datetime.utcnow() - timedelta(days=1)
    messages = models.Message.query.filter(
        models.Message.room == room,
        models.Message.timestamp > oldest,
    ).order_by(
        # Descending timestamp so page 1 is the most recent
        # i.e. for page size 3 for the following messages: abcdefghi -> we get ihg, fed, cba
        models.Message.timestamp.desc()
    ).paginate(page, MESSAGES_PER_PAGE, False).items
    # Setting to descending also flips the order
    # We want to see ghi in chat, but the query gave us ihg, so reverse that (hence reversed(messages))
    return jsonify({'messages': [msg.to_dict() for msg in reversed(messages)]})


@api.route('/users')
@api.route('/users/<username>', methods=['GET'])
@login_required
def get_user(username=None):
    if not username:
        results = {'users': [
            {'user': user.to_dict()} for user in models.User.query.all()
        ]}
    else:
        user = models.User.query.filter(
            models.User.username == username
        ).first()
        results = user.to_dict() if user else {}
    return jsonify(results)


@api.route('/broadcast', methods=['POST'])
@admin_or_localhost_required
def broadcast():
    message = request.form['message']
    announcement_type = request.form.get('type', 'info')
    emit('announcement', {'message': message, 'type': announcement_type}, namespace='/broadcast', broadcast=True)
    return Response(response=message, status=200)
