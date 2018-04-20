from functools import wraps
from app.utils.utils import get_remote_addr
from flask import abort
from flask_login import current_user


def admin_required(func):
    """Only admins should be allowed to access views decorated with admin_required"""
    @wraps(func)
    def decorated_view(*args, **kwargs):
        if current_user.is_authenticated and current_user.is_admin:
            return func(*args, **kwargs)
        else:
            return abort(403)
    return decorated_view


def admin_or_localhost_required(func):
    @wraps(func)
    def decorated_view(*args, **kwargs):
        # all but one post online from multiple sources seem to think that localhost is okay to bind to
        # if they somehow manage to break in via multiple CVEs on routers, switches, and firewalls, kudos to them
        # they can send whatever announcements they want!
        if (current_user.is_authenticated and current_user.is_admin) or (get_remote_addr() == '127.0.0.1'):
            return func(*args, **kwargs)
        else:
            return abort(403)
    return decorated_view