from flask import request, Response
from flask_socketio import emit

from app import db, models
from app.utils.decorators.admin import admin_or_localhost_required, admin_required
from . import admin_console


@admin_console.route('/all_users_admin', methods=['POST'])
@admin_or_localhost_required
def all_users_admin():
    action = request.form['action']
    if action == 'all_users_announce':
        data = {'message': request.form['message'],
                'type': request.form.get('type', 'info')}
    else:
        data = {}
    emit(action, data, namespace='/admin', broadcast=True)
    return Response(response=action + ' submitted', status=200)


@admin_console.route('/ban', methods=['POST'])
@admin_required
def ban():
    username = request.form['username']
    user = models.User.query.filter(
        models.User.username == username
    ).first()
    user.is_banned = True
    db.session.commit()
    return Response(response='Banned {username}'.format(username=username), status=200)


@admin_console.route('/unban', methods=['POST'])
@admin_required
def unban():
    username = request.form['username']
    user = models.User.query.filter(
        models.User.username == username
    ).first()
    user.is_banned = False
    db.session.commit()
    return Response(response='Unbanned {username}'.format(username=username), status=200)
