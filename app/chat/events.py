from collections import defaultdict
from flask import request
from flask_login import current_user
from flask_socketio import emit, join_room
from app import socketio, db
from app.models import Message
# from app.utils.markup.momentjs import MomentJs


def defaultdict_set():
    return defaultdict(set)
ONLINE_USERS = defaultdict(defaultdict_set)

PRIVATE_ROOMS = defaultdict(set)


@socketio.on('joined', namespace='/chat')
def joined(data):
    """Sent by clients when they enter a room.
    A status message is broadcast to all people in the room."""
    # FIXME: Sometimes stale connections keep trying to reconnect and keep emitting joined event
    # FIXME: Not sure if this is the right approach but suppress these warnings for now so it doesn't clutter the logs
    room = data['room']
    sid = data.get('sid') or request.sid
    if not current_user.is_anonymous:
        username = current_user.username
        join_room(room)
        # Treat my socket id as my room name
        join_room(sid)
        ONLINE_USERS[username][room].add(sid)
        PRIVATE_ROOMS[username].add(sid)
        # FIXME: Move div generation to client-side
        online = ['<div id="chat_username" user="%s">%s</div>' % (u, u)
                  for (u, rooms_and_sox) in ONLINE_USERS.items() if room in rooms_and_sox]
        emit('status', {'online_users': online}, room=room)


@socketio.on('disconnect', namespace='/chat')
def disconnect():
    #FIXME: see if we can get the socket to send socket id on disconnect instead of relying on request.sid
    sid = request.sid
    for room, sids in ONLINE_USERS[current_user.username].items():
        if sid in sids:
            sids.remove(sid)
            if not sids:
                # FIXME: Move div generation to client-side
                online = ['<div id="chat_username" user="%s">%s</div>' % (u, u)
                          for u in ONLINE_USERS if u != current_user.username]
                emit('status', {'online_users': online}, room=room)

    remaining_rooms = defaultdict(set)
    for room, sids in ONLINE_USERS[current_user.username].items():
        if sids:
            remaining_rooms[room] = sids
    ONLINE_USERS[current_user.username] = remaining_rooms

    # FIXME: All this tracking should probably be a separate service/class by now
    remaining_private_rooms = PRIVATE_ROOMS.get(current_user.username, set())
    if sid in remaining_private_rooms:
        remaining_private_rooms.remove(sid)
    if not remaining_private_rooms:
        PRIVATE_ROOMS.pop(current_user.username, None)
    else:
        PRIVATE_ROOMS[current_user.username] = remaining_private_rooms


@socketio.on('sent', namespace='/chat')
def receive(data):
    content = data['msg']
    room = data['room']
    username = current_user.username
    namespace = '/chat'
    db.session.add(Message(user_id=current_user.id, content=content, room=room, namespace=namespace))
    db.session.commit()
    emit('received',
         {
             'content': content,
             'username': username,
             'private': False,  # send back whether it was private or not so we can highlight it
             # 'email': current_user.email,
             # 'last_seen': MomentJs(current_user.last_seen).calendar(),  # Additional params can be sent here too
         }, room=room)


@socketio.on('whispered', namespace='/chat')
def receive_whisper(data):
    content = data['msg']
    username = current_user.username
    to, *_ = content.split(' ', maxsplit=1)
    recipient_rooms = PRIVATE_ROOMS.get(to[1:])  # trim the leading @
    my_rooms = PRIVATE_ROOMS.get(username)

    if not recipient_rooms:
        content = 'Not delivered: ' + content
    else:
        for room in recipient_rooms:
            emit('received',
                 {
                     'content': content,
                     'username': username,
                     'private': True,
                 }, room=room)

    for room in my_rooms:
        # Also emit to myself to see whether the message was delivered or not
        emit('received',
             {
                 'content': content,
                 'username': username,
                 'private': True,
             }, room=room)
