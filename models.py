from google.cloud.ndb.model import DateTimeProperty
from google.cloud.ndb.query import OR
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin, LoginManager
import os
from google.cloud import ndb
from datetime import datetime, timedelta

from werkzeug.utils import redirect
from werkzeug.wrappers import request

credentials_path = "playlistdatastore.json"
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials_path

login_model = LoginManager()
db = ndb.Client()

class Playlist(ndb.Model):
	playlistname = ndb.GenericProperty()
	user_id = ndb.StringProperty()
	

class SongsList(ndb.Model):
    song = ndb.StringProperty()
    artists = ndb.StringProperty()
    duration = ndb.StringProperty()
    created = ndb.DateTimeProperty()

    @classmethod
    def searchsong(cls, name):
        q = cls.query().filter(name.IN(OR(cls.song,
                                     cls.artists))).fetch()
        return q
    
class PlaylistSong(ndb.Model):
    playlist_id = ndb.StringProperty()
    song_id = ndb.StringProperty()
    user_id = ndb.StringProperty()
    song_name = ndb.StringProperty()

class User(UserMixin, ndb.Model):
    name = ndb.StringProperty()
    email = ndb.StringProperty()
    password_hash = ndb.StringProperty()

    @classmethod
    def by_id(cls, id):
        return User.get_by_id(id)
    
    def set_password(self,password):
        self.password_hash = generate_password_hash(password)
     
    def check_password(self,password):
        return check_password_hash(self.password_hash,password)

    def get_id(self):
        return self.email

class Admin(UserMixin, ndb.Model):
    name = ndb.StringProperty()
    email = ndb.StringProperty()
    password_hash = ndb.StringProperty()

    @classmethod
    def by_id(cls, id):
        return Admin.get_by_id(id)
    
    def set_password(self,password):
        self.password_hash = generate_password_hash(password)
     
    def check_password(self,password):
        return check_password_hash(self.password_hash,password)

    def get_id(self):
        return self.email


@login_model.user_loader
def load_user(email):
    return User.query(User.email==email)

