from flask_wtf import FlaskForm
from wtforms import StringField
from wtforms.validators import Length, Regexp


class SignupForm(FlaskForm):
    username = StringField(
        'username', validators=[
            Regexp(r'^[\w.+-_]+$', message='Only alphanumeric and the following chars allowed: .+-_'),
            Length(min=3, max=16, message='Username needs to be between 3 and 16 chars long')
        ]
    )


class PostForm(FlaskForm):
    content = StringField('content')
    category = StringField('category')
