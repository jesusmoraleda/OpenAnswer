from flask import request, Response
from flask_socketio import emit

from app.utils.decorators.admin import admin_or_localhost_required
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
