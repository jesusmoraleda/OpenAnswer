from flask import send_from_directory

from . import reactjs


@reactjs.route('/', defaults={'path': ''})
# We also need to serve the static files
@reactjs.route('/<path:path>')
def serve(path):
    return send_from_directory(reactjs.static_folder, path or 'index.html')
