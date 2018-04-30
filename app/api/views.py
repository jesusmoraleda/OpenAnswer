from datetime import datetime, timedelta
from flask import jsonify
from flask_login import login_required
from app import models

from . import api


MESSAGES_PER_PAGE = 75


@api.route('/messages/<room>', methods=['GET'])
@api.route('/messages/<room>/<int:page>', methods=['GET'])
@login_required
# Pages are in reverse (1 being the most recent).
def get_messages(room, page=1):
    # Only go back a week
    oldest = datetime.utcnow() - timedelta(days=7)
    messages = models.Message.query.filter(
        models.Message.room == room,
        models.Message.timestamp > oldest,
    ).order_by(
        # Descending timestamp so page 1 is the most recent
        # i.e. for page size 3 for the following messages: abcdefghi -> we get ihg, fed, cba
        models.Message.timestamp.desc()
    ).paginate(page, MESSAGES_PER_PAGE, False).items
    # Setting to descending also flips the order
    # We want to see ghi in chat, but the query gave us ihg, so the UI has to reverse this
    return jsonify({'messages': [msg.to_dict() for msg in messages]})


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
