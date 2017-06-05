from flask import jsonify, render_template
from flask_login import login_required, current_user

from . import chat


@chat.route('/chat/<room>')
@login_required
def chat_room(room):
    return render_template('chat/chat.html', title='(0) %s' % room.capitalize(), user=current_user, navtab='chat')


@chat.route('/online')
@login_required
def online_users():
    if current_user.is_admin:
        from .events import ONLINE_USERS
        return jsonify(ONLINE_USERS.get_all_users())
    else:
        return {'online': 'Only admins can see this'}
