from collections import defaultdict
from datetime import datetime
from email import utils
from flask import request
from flask_login import current_user
from flask_socketio import emit, join_room, leave_room
from app import socketio, db
from app.models import Message

PRIVATE_ROOMS = defaultdict(set)


class OnlineUsers:
    def __init__(self):
        """sid: room"""
        self.sockets_to_rooms = {}
        self.sockets_to_usernames = {}

    def joined(self, sid, room):
        # Treat my socket id as my room name
        PRIVATE_ROOMS[current_user.username].add(sid)
        self.sockets_to_rooms[sid] = room
        self.sockets_to_usernames[sid] = current_user.username

    def disconnected(self, sid):
        room = self.sockets_to_rooms.pop(sid, None)
        self.sockets_to_usernames.pop(sid, None)
        PRIVATE_ROOMS.pop(sid, None)
        return room

    def get_users(self, room):
        sockets = (sid for (sid, r) in self.sockets_to_rooms.items() if r == room)
        return set(self.sockets_to_usernames[sid] for sid in sockets)

    def get_all_users(self):
        return [
            {self.sockets_to_usernames[sid]: (room, sid)} for (sid, room) in self.sockets_to_rooms.items()
        ]


ONLINE_USERS = OnlineUsers()


@socketio.on('joined', namespace='/chat')
def joined(data):
    """Sent by clients when they enter a room.
    A status message is broadcast to all people in the room."""
    # FIXME: Sometimes stale connections keep trying to reconnect and keep emitting joined event
    # FIXME: Not sure if this is the right approach but suppress these warnings for now so it doesn't clutter the logs
    room = data['room']
    sid = request.sid
    if not current_user.is_anonymous:
        join_room(sid)
        join_room(room)
        ONLINE_USERS.joined(sid, room)
        online = ['<div id="chat_username" user="%s">%s</div>' % (u, u) for u in ONLINE_USERS.get_users(room)]
        emit('status', {'online_users': online}, room=room)


@socketio.on('left', namespace='/chat')
def left(data):
    room = data['room']
    leave_room(room)


@socketio.on('disconnect', namespace='/chat')
def disconnect():
    sid = request.sid
    room = ONLINE_USERS.disconnected(sid)
    # FIXME: need to implement this in left event.
    online = ['<div id="chat_username" user="%s">%s</div>' % (u, u) for u in ONLINE_USERS.get_users(room)]
    emit('status', {'online_users': online}, room=room)


@socketio.on('sent', namespace='/chat')
def receive(data):
    content = data['msg']
    room = data['room']
    username = current_user.username
    namespace = '/chat'
    m = Message(user_id=current_user.id, content=content, room=room, namespace=namespace)
    db.session.add(m)
    db.session.commit()
    emit('received',
         {
             'content': content,
             'username': username,
             'private': False,
             'timestamp': utils.format_datetime(m.timestamp),
             'room': room,
         }, room=room)


@socketio.on('whispered', namespace='/chat')
def receive_whisper(data):
    content = data['msg']
    username = current_user.username
    to, *_ = content.split(' ', maxsplit=1)
    recipient_rooms = PRIVATE_ROOMS.get(to[1:])  # trim the leading @
    my_rooms = PRIVATE_ROOMS.get(username)
    ts = datetime.utcnow()
    if not recipient_rooms:
        content = 'Not delivered: ' + content
    else:
        for room in recipient_rooms:
            emit('received',
                 {
                     'content': content,
                     'username': username,
                     'private': True,
                     'timestamp': utils.format_datetime(ts),
                 }, room=room)

    for room in my_rooms:
        # Also emit to myself to see whether the message was delivered or not
        emit('received',
             {
                 'content': content,
                 'username': username,
                 'private': True,
                 'timestamp': utils.format_datetime(ts),
             }, room=room)
