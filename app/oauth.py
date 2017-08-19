import json

from flask import current_app, url_for, request, redirect
from rauth import OAuth2Service


class OAuthSignIn:
    providers = None

    def __init__(self, provider_name):
        self.provider_name = provider_name
        credentials = current_app.config['OAUTH_CREDENTIALS'][provider_name]
        self.consumer_id = credentials['id']
        self.consumer_secret = credentials['secret']

    def json_decode(self, content):
        return json.loads(content.decode())

    def authorize(self):
        pass

    def callback(self):
        pass

    def get_callback_url(self):
        return url_for('oauth_callback', provider=self.provider_name,
                       _external=True)

    @classmethod
    def get_provider(self, provider_name):
        if self.providers is None:
            self.providers = {}
            for provider_class in self.__subclasses__():
                provider = provider_class()
                self.providers[provider.provider_name] = provider
        return self.providers[provider_name]


class FacebookSignIn(OAuthSignIn):
    def __init__(self):
        super(FacebookSignIn, self).__init__('facebook')
        self.service = OAuth2Service(
            name='facebook',
            client_id=self.consumer_id,
            client_secret=self.consumer_secret,
            authorize_url='https://graph.facebook.com/oauth/authorize',
            access_token_url='https://graph.facebook.com/oauth/access_token',
            base_url='https://graph.facebook.com/'
        )

    def authorize(self):
        return redirect(self.service.get_authorize_url(
            scope='email',
            response_type='code',
            redirect_uri=self.get_callback_url())
        )

    def callback(self):
        if 'code' not in request.args:
            return None
        oauth_session = self.service.get_auth_session(
            data={'code': request.args['code'],
                  'grant_type': 'authorization_code',
                  'redirect_uri': self.get_callback_url()},
            decoder=self.json_decode
        )
        me = oauth_session.get('me?fields=email').json()
        return me.get('email')


class GoogleSignIn(OAuthSignIn):
    def __init__(self):
        super(GoogleSignIn, self).__init__('google')
        self.service = OAuth2Service(
            name='google',
            client_id=self.consumer_id,
            client_secret=self.consumer_secret,
            authorize_url='https://accounts.google.com/o/oauth2/auth',
            access_token_url='https://accounts.google.com/o/oauth2/token',
            base_url='https://accounts.google.com/'
        )

    def authorize(self):
        return redirect(self.service.get_authorize_url(
            scope='email',
            response_type='code',
            redirect_uri=self.get_callback_url())
        )

    def callback(self):
        if 'code' not in request.args:
            return None
        oauth_session = self.service.get_auth_session(
            data={'code': request.args['code'],
                  'grant_type': 'authorization_code',
                  'redirect_uri': self.get_callback_url()},
            decoder=self.json_decode
        )
        me = oauth_session.get('https://www.googleapis.com/oauth2/v1/userinfo').json()
        return me.get('email')


class SlackSignIn(OAuthSignIn):
    def __init__(self):
        super(SlackSignIn, self).__init__('slack')
        self.service = OAuth2Service(
            name='slack',
            client_id=self.consumer_id,
            client_secret=self.consumer_secret,
            authorize_url='https://slack.com/oauth/authorize',
            access_token_url='https://slack.com/api/oauth.access',
            base_url='https://slack.com/'
        )

    def authorize(self):
        return redirect(self.service.get_authorize_url(
            scope='identity.basic,identity.email',
            redirect_uri=self.get_callback_url())
        )

    def callback(self):
        if 'code' not in request.args:
            return None
        oauth_session = self.service.get_auth_session(
            data={'code': request.args['code'],
                  'redirect_uri': self.get_callback_url()},
            decoder=self.json_decode
        )
        resp = self.json_decode(oauth_session.access_token_response.content)
        me = self.json_decode(oauth_session.post('https://slack.com/api/users.identity', data={'token': resp['access_token']}).content)['user']
        return me.get('email')
