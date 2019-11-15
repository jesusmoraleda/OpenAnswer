from flask import send_from_directory
from flask_login import login_required

from . import reactjs


@reactjs.route('/', defaults={'path': ''})
# We also need to serve the static files
@reactjs.route('/<path:path>')
@login_required
def serve(path):
    return send_from_directory(reactjs.static_folder, path or 'index.html')
