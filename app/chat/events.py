from collections import defaultdict
from datetime import datetime
from email import utils
from flask import request
from flask_login import current_user
import flask_socketio
from app import socketio, db
from app.models import Message

# OnlineUsers.sockets_to_usernames maps socket ids to usernames.
# PRIVATE_ROOMS maps usernames to socket ids.
# I think it's okay to keep both so we can quickly identify which "SID"s a user is in, and which users are in a given "SID"


PRIVATE_ROOMS = defaultdict(set)


class OnlineUsers:
    def __init__(self):
        """sid: room"""
        self.sockets_to_rooms = defaultdict(list)
        self.sockets_to_usernames = {}

    def joined(self, sid, room):
        # Treat my socket id as my room name
        PRIVATE_ROOMS[current_user.username].add(sid)
        self.sockets_to_rooms[sid].append(room)
        self.sockets_to_usernames[sid] = current_user.username
        update_online_userlist(room)

    def disconnected(self, sid, room=None):
        if room:
            self.sockets_to_rooms[sid].remove(room)
            remaining_rooms = self.sockets_to_rooms[sid]
            if remaining_rooms:
                return update_online_userlist(room)

        # Retain the rooms the disconnected user was in so we can update the status to others
        old_rooms = self.sockets_to_rooms.get(sid, [])
        # Remove them from those rooms so when the status is updated, you don't see them there
        self.sockets_to_rooms.pop(sid, None)
        self.sockets_to_usernames.pop(sid, None)
        PRIVATE_ROOMS[current_user.username].remove(sid)
        # Update the statuses for the rooms that the user disconnected from
        for room in old_rooms:
            update_online_userlist(room)

    def get_users(self, room):
        sockets = (sid for (sid, rooms_for_sid) in self.sockets_to_rooms.items() if room in rooms_for_sid)
        return set(self.sockets_to_usernames[sid] for sid in sockets)

    def get_all_users(self):
        return [
            {self.sockets_to_usernames[sid]: (room, sid)} for (sid, room) in self.sockets_to_rooms.items()
        ]


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
    # FIXME: Sometimes stale connections keep trying to reconnect and keep emitting joined event
    # FIXME: Not sure if this is the right approach but suppress these warnings for now so it doesn't clutter the logs
    room = data['room']
    # FIXME: FIX SPECIAL ROOM LIST TREATMENT!!!!! Why did I write this comment?
    sid = request.sid
    if not current_user.is_anonymous:
        flask_socketio.join_room(sid)
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
            flask_socketio.emit('received',
                 {
                     'content': content,
                     'username': username,
                     'private': True,
                     'timestamp': utils.format_datetime(ts),
                 }, room=room)

    for room in my_rooms:
        # Also emit to myself to see whether the message was delivered or not
        flask_socketio.emit('received',
             {
                 'content': content,
                 'username': username,
                 'private': True,
                 'timestamp': utils.format_datetime(ts),
             }, room=room)


def update_online_userlist(room):
    # FIXME: Change to broadcast?
    online = ['<div id="chat_username" user="%s">%s</div>' % (u, u) for u in ONLINE_USERS.get_users(room)]
    flask_socketio.emit('status', {'online_users': online, 'room': room}, room=room)
    # Also update the list of users in Room List
    flask_socketio.emit('status', {'online_users': online, 'room': room}, room='Room List')
