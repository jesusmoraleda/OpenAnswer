from flask import jsonify, render_template
from flask_login import login_required, current_user

from . import chat


@chat.route('/alpha-chat')
@login_required
def alpha_chat():
    return render_template('chat/chat-alpha.html', title='Chat', user=current_user, navtab='alpha-chat')


@chat.route('/online')
@login_required
def online_users():
    from .events import ONLINE_USERS
    if current_user.is_admin:
        return jsonify(ONLINE_USERS.get_all_users())
    else:
        return jsonify({'online': 'Only admins can see this'})
