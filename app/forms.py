from flask_wtf import FlaskForm
from wtforms import StringField
from wtforms.validators import Length, Regexp, UUID, ValidationError
import os


class SignupForm(FlaskForm):
    username = StringField(
        'username', validators=[
            Regexp(r'^[a-z][a-z0-9_]+$',
                   message='Usernames must start with a lowercase letter. ' +
                           'Subsequent characters must be lowercase alphanumeric or _.'),
            Length(min=3, max=16, message='Username needs to be between 3 and 16 chars long')
        ]
    )
    if os.environ['IS_BETA']:
        beta_key = StringField(
            'beta-key', validators=[UUID(message='Message must be a beta-key'),
                                    validate_beta_key]
        )



class PostForm(FlaskForm):
    content = StringField('content')
    category = StringField('category')


def validate_beta_key(form, field):
    with open(os.environ['BETA_KEYS_PATH']) as f:
        if field.data not in f.readlines():
            raise ValidationError(message='Invalid key')