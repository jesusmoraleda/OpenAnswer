from datetime import datetime

from app import app, db
from app.oauth import OAuthSignIn
from flask import flash, g, redirect, render_template, request, url_for
from flask_admin.contrib.sqla import ModelView
from flask_login import login_user, logout_user, current_user, login_required
from sqlalchemy.sql import exists
from .forms import SignupForm, PostForm
from .models import Post, User, UserIp


@app.before_request
def before_request():
    g.user = current_user
    if g.user.is_authenticated:
        g.user.last_seen = datetime.utcnow()
        db.session.add(g.user)
        db.session.commit()


# Taken from https://github.com/mattupstate/flask-security/blob/f3948038ece799267597bf63b00fd02f4e6daedb/flask_security/utils.py#L64
def _get_remote_addr():
    if 'X-Forwarded-For' in request.headers:
        remote_addr = request.headers.getlist('X-Forwarded-For')[0].rpartition(' ')[-1]
    else:
        remote_addr = request.remote_addr or 'IP not found'
    return remote_addr


def _login_user_and_record_ip(usr, remember=True):
    db.session.add(UserIp(user_id=usr.id, ip_address=_get_remote_addr(), timestamp=datetime.utcnow()))
    db.session.commit()
    login_user(usr, remember)


@app.route('/')
def home():
    if not current_user.is_anonymous:
        return redirect(url_for('alpha-chat'))
    return render_template('home.html', title='Welcome to OpenAnswer')


@app.route('/logs')
@login_required
def logs():
    if current_user.is_admin:
        with open('./gunicorn_logs') as f:
            return render_template('logs.html', log_content=f.read())


@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('home'))


@app.route('/user/<username>')
@login_required
def user(username):
    _user = User.query.filter_by(username=username).first()
    if not _user:
        flash('User %s not found' % username)
        return redirect(url_for('home'))
    posts = Post.query.filter_by(user_id=_user.id)
    return render_template('user.html', title='Profile', user=_user, posts=posts, navtab='user')


@app.route('/signup/<email>', methods=['GET', 'POST'])
def signup(email):
    form = SignupForm()
    if form.validate_on_submit():
        username = form.username.data
        if not db.session.query(exists().where(User.username == username)).scalar():
            _user = User(username=username, email=email)
            db.session.add(_user)
            db.session.commit()
            _login_user_and_record_ip(_user)
            return redirect(url_for('home'))
        else:
            form.username.errors.append('That username has been registered, please pick a new one')
    return render_template('signup.html', title='Signup', form=form)


@app.route('/authorize/<provider>')
def oauth_authorize(provider):
    if not current_user.is_anonymous:
        return redirect(url_for('home'))
    oauth = OAuthSignIn.get_provider(provider)
    return oauth.authorize()


@app.route('/callback/<provider>')
def oauth_callback(provider):
    if not current_user.is_anonymous:
        return redirect(url_for('home'))
    oauth = OAuthSignIn.get_provider(provider)
    email = oauth.callback()
    if email is None:
        flash('Authentication failed.')
        return redirect(url_for('home'))
    _user = User.query.filter_by(email=email).first()
    if not _user:
        return redirect(url_for('signup', email=email))
    _login_user_and_record_ip(_user, True)
    return redirect(url_for('home'))


@app.route('/meta', methods=['GET', 'POST'])
@login_required
def meta():
    meta_posts = Post.query.filter_by(category='Meta')
    form = PostForm()
    if form.validate_on_submit():
        # FIXME: Don't allow duplicate posts
        _post = Post(user_id=g.user.id, body=form.content.data, category=form.category.data, timestamp=datetime.utcnow())
        db.session.add(_post)
        db.session.commit()
    return render_template('meta.html', title='Meta', posts=meta_posts, form=form, navtab='meta')


@app.route('/help')
def help():
    return render_template('help.html', title='Help', navtab='help')


@app.route('/settings')
@login_required
def settings():
    return render_template('settings.html', title='Settings', navtab='settings', user=current_user)


# Admin views here
class AdminModelView(ModelView):
    page_size = 200

    def is_accessible(self):
        return g.user.is_authenticated and g.user.is_admin
