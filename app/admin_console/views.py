import hashlib
import hmac
import os
import subprocess

from flask import abort, request, Response
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


@admin_console.route('/redeploy', methods=['POST'])
def redeploy_hook():
    payload = request.data
    # with open('payload_contents.txt', 'w') as f:
    #     f.write(str(payload))
    # with open('request_headers.txt', 'w') as f:
    #     f.write(str(request.headers))
    signature = request.headers.get('X-Hub-Signature')
    if not signature or not verify_git_signature(payload, signature):
        return abort(400, 'Missing signature header, cannot verify request')
    else:
        if payload['ref'] == "refs/heads/master":
            try:
                # This is stupid, the server will be dead after this command, so why even send it back
                # I suppose this might suffice for testing purposes.
                output = _redeploy()
            except Exception:
                return abort(500, 'Redeploy failed')
    return Response(response=str(output), status=200)


def _redeploy():
    path_to_rld = os.path.join(os.environ['OPENANSWER_PATH'], 'maintenance', 'rld')
    output = subprocess.Popen(['bash', '-c', '. %s; rld' % path_to_rld])
    return output


def verify_git_signature(data, signature):
    secret = bytes(os.environ['GIT_HOOK_SECRET'], 'utf-8')
    mac = hmac.new(secret, msg=data, digestmod=hashlib.sha1)
    return hmac.compare_digest('sha1='+mac.hexdigest(), signature)
