from flask import render_template
from flask_login import login_required, current_user

from . import chat


@chat.route('/chat/<room>')
@login_required
def chat_room(room):
    return render_template('chat/chat.html', title='(0) %s' % room.capitalize(), user=current_user, navtab='chat')
