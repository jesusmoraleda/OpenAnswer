import logging
from collections import defaultdict
from email import utils
from flask import request
from flask_login import current_user
import flask_socketio
from app import socketio, db
from app.models import Message

logger = logging.getLogger(__name__)

# OnlineUsers.sockets_to_usernames maps socket ids to usernames.
# I think it's okay to keep both so we can quickly identify which SIDs a user is in, and which users are in a given SID


class OnlineUsers:
    def __init__(self):
        self.sockets_to_rooms = defaultdict(list)
        self.sockets_to_usernames = {}

    def joined(self, sid, room):
        # Treat my socket id as my room name
        self.sockets_to_rooms[sid].append(room)
        self.sockets_to_usernames[sid] = current_user.username
        self.push_online_user_updates([room])

    def disconnected(self, sid, room=None):
        if room:
            self.sockets_to_rooms[sid].remove(room)
            remaining_rooms = self.sockets_to_rooms[sid]
            if remaining_rooms:
                return self.push_online_user_updates([room])
        # Retain the rooms the disconnected user was in so we can update the status to others
        old_rooms = self.sockets_to_rooms.get(sid, [])
        # Remove them from those rooms so when the status is updated, you don't see them there
        self.sockets_to_rooms.pop(sid, None)
        self.sockets_to_usernames.pop(sid, None)
        return self.push_online_user_updates(old_rooms)

    def get_users(self, room):
        sockets = (sid for (sid, rooms_for_sid) in self.sockets_to_rooms.items() if room in rooms_for_sid)
        return set(self.sockets_to_usernames[sid] for sid in sockets)

    def get_all_users(self):
        return [
            {self.sockets_to_usernames[sid]: (room, sid)} for (sid, room) in self.sockets_to_rooms.items()
        ]

    def push_online_user_updates(self, rooms):
        for room in rooms:
            # FIXME: Change to broadcast, also get rid of divs in here.
            online = ['<div id="chat_username" user="%s">%s</div>' % (u, u) for u in ONLINE_USERS.get_users(room)]
            flask_socketio.emit('status', {'online_users': online, 'room': room}, room=room)

ONLINE_USERS = OnlineUsers()


@socketio.on('connect', namespace='/chat')
def connect():
    return current_user.is_authenticated


@socketio.on('reconnect', namespace='/chat')
def reconnect():
    return current_user.is_authenticated


@socketio.on('joined', namespace='/chat')
def joined(data):
    """Sent by clients when they enter a room.
    A status message is broadcast to all people in the room."""
    room = data['room']
    sid = request.sid
    if not current_user.is_anonymous:
        flask_socketio.join_room(room)
        ONLINE_USERS.joined(sid, room)


@socketio.on('left', namespace='/chat')
def left(data):
    room = data['room']
    flask_socketio.leave_room(room)
    ONLINE_USERS.disconnected(request.sid, room)


@socketio.on('disconnect', namespace='/chat')
def disconnect():
    sid = request.sid
    if current_user.is_authenticated:
        ONLINE_USERS.disconnected(sid)


@socketio.on('sent', namespace='/chat')
def receive(data):
    # Banned users aren't authenticated, current_user.is_banned check is redundant.
    if not current_user.is_authenticated:
        return flask_socketio.disconnect()
    content = data['msg']
    room = data['room']
    username = current_user.username
    namespace = '/chat'
    m = Message(user_id=current_user.id, content=content, room=room, namespace=namespace)
    db.session.add(m)
    db.session.commit()
    flask_socketio.emit('received',
         {
             'content': content,
             'username': username,
             'private': False,
             'timestamp': utils.format_datetime(m.timestamp),
             'room': room,
         }, room=room)


