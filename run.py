#!ve/bin/python
from app import app, socketio

if __name__ == '__main__':
    socketio.run(app)
    # We're okay manually restarting the server during the development for now
    app.run(debug=False)
