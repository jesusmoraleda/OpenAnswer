from functools import wraps

from flask import abort
from flask_login import current_user


def admin_required(func):
    """Only admins should be allowed to access views decorateed with admin_required"""
    @wraps(func)
    def decorated_view(*args, **kwargs):
        if current_user.is_authenticated and current_user.is_admin:
            return func(*args, **kwargs)
        else:
            return abort(403)
    return decorated_view
