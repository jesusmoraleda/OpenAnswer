from flask import jsonify, render_template
from flask_login import login_required, current_user

from . import chat


@chat.route('/chat/<room>')
@login_required
def chat_room(room):
    return render_template('chat/chat.html', title='(0) %s' % room.capitalize(), user=current_user, navtab='chat')


@chat.route('/alpha-chat')
@login_required
def alpha_chat():
    return render_template('chat/chat-alpha.html', title='Chat', user=current_user, navtab='alpha-chat')


@chat.route('/online')
@chat.route('/online/<room>', methods=['GET'])
@login_required
def online_users(room=None):
    from .events import ONLINE_USERS
    if not room:
        if current_user.is_admin:
            return jsonify(ONLINE_USERS.get_all_users())
        else:
            return jsonify({'online': 'Only admins can see this'})
    else:
        return jsonify({'online': list(ONLINE_USERS.get_users(room))})
