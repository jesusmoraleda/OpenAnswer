from flask import request


# Taken from https://github.com/mattupstate/flask-security/blob/f3948038ece799267597bf63b00fd02f4e6daedb/flask_security/utils.py#L64
def get_remote_addr():
    if 'X-Forwarded-For' in request.headers:
        remote_addr = request.headers.getlist('X-Forwarded-For')[0].rpartition(' ')[-1]
    else:
        remote_addr = request.remote_addr or 'IP not found'
    return remote_addr
