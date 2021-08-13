from base64 import decode
import os
from time import perf_counter
from weakref import ProxyTypes
from authlib.integrations import flask_client
from flask import Flask, render_template, redirect, request, session, flash, url_for
from flask import json
from flask.helpers import safe_join, url_for
from flask.json import jsonify
from flask_login.utils import login_required
from flask_session import Session
from google.api_core.retry import exponential_sleep_generator
from google.cloud.datastore_v1.proto.query_pb2 import Projection
from google.cloud.ndb.model import User
from google.cloud.ndb.query import OR
from google.protobuf import reflection
from google.protobuf.internal.well_known_types import Duration
from grpc import method_handlers_generic_handler
from werkzeug.security import check_password_hash
from models import Playlist, SongsList, User, Admin, PlaylistSong, db, load_user, login_model
from flask_login import login_user, current_user
import re, uuid, csv
from google.cloud import ndb
from google.cloud.ndb import Key, Cursor, key
from datetime import date, datetime
from authlib.integrations.flask_client import OAuth
from flask_session import Session


credentials_path = "google_credentials.json"
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials_path

db = ndb.Client()

app = Flask(__name__)
app.secret_key = 'meanttobesecret'

oauth = OAuth()
oauth.init_app(app=app)

app.config['GOOGLE_CLIENT_ID'] = "your_Google_Client_ID"
app.config['GOOGLE_CLIENT_SECRET'] = "Google_Client_Secret"


google = oauth.register(
    name= 'google',
    client_id = app.config['GOOGLE_CLIENT_ID'],
    client_secret = app.config['GOOGLE_CLIENT_SECRET'],
    access_token_url = "https://accounts.google.com/o/oauth2/token",
    access_token_params = None, 
    authorize_url = "https://accounts.google.com/o/oauth2/auth",
    authorize_params = None, 
    api_base_url = 'https://www.googleapis.com/oauth2/v1/',
    userinfo_endpoint = 'https://openidconnect.googleapis.com/v1/userinfo',
    client_kwargs = {'scope': 'openid email profile'},
)

login_manager = login_model
login_manager.init_app(app)
login_manager.login_view = 'login'

@app.route("/", methods=['GET','POST'])
def home():
    email=request.args.get('email')
    name=request.args.get('name')
    if email != None:
        return render_template("index.html", email=email, name=name)
    return render_template("index.html")


@app.route("/login", methods=[ "POST", "GET"])
def login():
    '''user login'''
    with db.context():
        msg = None
        _id = None
        if request.method == "POST":
            log = request.get_json(force=True)
            email = log.get('Mail')
            pword = log.get('Password')
            session['user'] = email
            user_det = User.query(User.email == email).fetch()
            for i in user_det:
                _id = i.key.id()
                name = i.name
                user = User.get_by_id(_id)
                break
            if _id == None or user == None:
                return jsonify({"No":"No Email Registered"})
            elif user.email == 'admin@app.com' and user.check_password(pword):
                return jsonify({"admin": "Admin Login!"})
            elif user is not None  and user.check_password(pword):
                login_user(user)
                return jsonify({"Name":name})
            else:
                return jsonify({"credentials":"Wrong Credentials"})
        return render_template("index.html", msg=msg)

regex = '^(\w|\.|\_|\-)+[@](\w|\_|\-|\.)+[.]\w{2,3}$'

@app.route("/register", methods=['GET', 'POST'])
def register():
    '''Registering new user'''
    with db.context():
        error = None
        if request.method == "POST":
            name_newuser = request.form.get('newUser_name')
            email_newuser = request.form.get('newUser_email')
            password_newuser = request.form.get('newUser_pword')
            con_password = request.form.get('newUser_con_pword')
            valid_email = re.search(regex, email_newuser)
            user_det = User.query(User.email == email_newuser).fetch()
            if user_det:
                flash("Email Already Registered! Please Log In")
                return redirect("/")
            if valid_email:
                if password_newuser == con_password:
                    user = User(
                        name=name_newuser,
                        email=email_newuser, 
                        password_hash=password_newuser)
                    user.set_password(password_newuser)
                    user.put()
                    flash("Please Log in with Your Credentials")
                    return redirect("/")
                else:
                    flash("Passwords doesn't match")
            else:
                flash("Please enter a valid email")
        return render_template("register.html", error=error)

@app.route("/admin/newadmin", methods=['POST'])
def newadmin():
    '''Registering new admin'''
    with db.context():
        error = None
        if request.method == "POST":
            res = request.get_json(force=True)
            name_new_admin = res.get('name')
            email_new_admin = res.get('email')
            password_new_admin = res.get('pword')
            con_password = res.get('confirm')
            valid_email = re.search(regex, email_new_admin)
            admin_check = Admin.query(Admin.email == email_new_admin).fetch()
            if admin_check:
                return "Admin Already Registered! Please Log In"
            if valid_email:
                if password_new_admin == con_password:
                    admin = Admin(
                        name=name_new_admin,
                        email=email_new_admin, 
                        password_hash=password_new_admin)
                    admin.set_password(password_new_admin)
                    admin.put()
                    user =  User(
                        name=name_new_admin, 
                        email=email_new_admin, 
                        password_hash=password_new_admin)
                    user.set_password(password_new_admin)
                    user.put()
                    return "Admin Added!"
                else:
                   return "Passwords doesn't match"
            else:
                return "Please enter a valid email"

@app.route("/admin/login", methods=['POST'])
def adminlogin():
    with db.context():
        if request.method == 'POST':
            res = request.get_json(force=True)
            email = res.get('Mail')
            pword = res.get('Password')
            session['user'] = email
            admin_det = Admin.query(Admin.email == email).fetch()
            for i in admin_det:
                _id = i.key.id()
                name = i.name
            try:
                admin = Admin.get_by_id(_id)
            except Exception as e:
                return jsonify({"error":"You are not an Admin!"})
            if admin == None:
                return jsonify({"No":"No Admin"})
            elif admin is not None  and admin.check_password(pword):
                login_user(admin)
                return jsonify({"Success":"Admin Login!"})
            else:
                return jsonify({"credentials":"Wrong Credentials"})

@app.route("/admin/addsong", methods=['POST'])
def addsong():
    with db.context():
        if request.method == 'POST':
            res = request.get_json(force=True)
            songname = res.get('song')
            artists = res.get('artist')
            duration = res.get('duration')
            created = datetime.now()
            intoDb =  SongsList(song=songname, 
                               artists=artists, 
                               duration=duration,
                               created=created)
            intoDb.put()
            return "Song Added into Db"

@app.route("/login/google")
def google_login():
    google = oauth.create_client('google')
    redirect_uri = url_for('google_authorize', _external=True)
    return google.authorize_redirect(redirect_uri)

@app.route("/login/google/authorize")
def google_authorize():
    google = oauth.create_client('google')
    token = google.authorize_access_token()
    resp = google.get('userinfo').json()
    email = resp.get('email')
    name = resp.get('name')
    with db.context():
        check_email = User.query(User.email == email).fetch()
        if check_email:
                session['user'] = email
                return redirect(url_for('home', email=email, name=name))
        flash("No email registered! Please Register!")
        return redirect('/')

@app.route('/logout')
def logout():
    session.pop("user", None)
    return redirect('/')


@app.route("/playlistname", methods=['POST'])
def playlistname():
    '''Posting user's playlist'''
    playlist_list = []
    with db.context():
        try:
            cust_id = session['user']
            user = User.query(User.email == cust_id).fetch()
            for i in user:
                _id = i.key.id()
        except Exception as e:
            info = "Please log in"
            return jsonify({"info":info})

        if request.method == 'POST':
            res = request.get_json(force=True)
            playlist_name = res.get('Playlist')     
            nameOfList = Playlist(playlistname= str(playlist_name), 
                                  user_id=str(_id))
            nameOfList.put()
            playlist_name_det = Playlist.query(Playlist.playlistname == playlist_name).fetch()
            for i in playlist_name_det:
                playlist_id = i.key.id()
            return jsonify({"id":playlist_id})

@app.route("/getplaylistname", methods=['GET'])
def getplaylistname():
    '''Retrieving user's playlists'''
    
    with db.context():
        get_playlist_list = []
        try:
            cust_id = session['user']
            user = User.query(User.email == cust_id).fetch()
            for i in user:
                _id = i.key.id()
                email = i.email
                name = i.name
        except Exception as e:
            info = "Please log in"
            return jsonify({"info":info})

        if request.method == 'GET':
            get_playlist = Playlist.query(
                            Playlist.user_id == str(_id)).fetch()
            for i in get_playlist:
                get_playlist_list.append({"Playlist":i.playlistname,
                                        "Playlist_id":i.key.id(),
                                        "user_id":i.user_id})
            if get_playlist_list == []:
                information = "Create New Playlist"
                return jsonify({"information":information})
            return jsonify({
                "Playlists": get_playlist_list,
                "email":email,
                "name":name})
      
            

''' Run this api only once to read songs into from local file

@app.route("/toDb", methods=['GET'])
def toDb():
    with db.context():
        if request.method == 'GET':
            with open("mock_list_1.csv", 'r') as rfile:
                reader = csv.DictReader(rfile)
                for row in reader:
                    detail = dict(row)
                    det.append(detail)
                return jsonify(det)
'''


det = []
@app.route("/songlist", methods=['GET', 'POST'])
def songlist():
    ''' API call to upload the songs into db'''
    with db.context():
            res = request.get_json(force=True)
            song = res.get("song")
            artist = res.get("artist")
            duration = res.get("duration")
            created = datetime.now()
            intoDb = SongsList(song=song, 
                               artists=artist, 
                               duration=duration, 
                               created=created)
            intoDb.put()
            return "Done"   

@app.route("/readsongs", methods=['GET', 'POST'])
def readsongs():
    '''getting songs from playlist'''
    with db.context():
        final_list = []
        full_list = SongsList.query()

        if request.method == 'GET':
            next_cursor = request.args.get('cursor')
            nextCursor = Cursor(urlsafe=next_cursor)

            if next_cursor == None:
                entities, cursor, more = full_list.fetch_page(page_size=10)
                currentCursor = cursor.urlsafe()
                for i in entities:
                    final_list.append({"songs":i.song, 
                                                "artist":i.artists, 
                                                "duration":i.duration, 
                                                "_id": i.key.id()})
                return jsonify({"songDetails":final_list,
                            'cursor': currentCursor.decode("utf-8")}) 

            if next_cursor != None:
                entities, cursor, more = full_list.fetch_page(page_size=10,
                                                            start_cursor=nextCursor)
                if not cursor:
                    return jsonify({"Success":"No more entries"})
                newCursor = cursor.urlsafe()

                for i in entities:
                    final_list.append({"songs":i.song, 
                                        "artist":i.artists, 
                                        "duration":i.duration, 
                                        "_id": i.key.id()})
            return jsonify({"songDetails":final_list,
                            'cursor': newCursor.decode("utf-8")}) 
            
      
@app.route("/addto", methods=['GET'])
def addto():
    '''API for adding songs to a playlist'''
    list_of_playlist = []
    with db.context():
        try:
            cust_id = session['user']
            user = User.query().fetch()
            for i in user:
                if i.email == cust_id:
                    _id = i.key.id()
        except Exception as e:
            info = "Please log in"
            return jsonify({"info":info})

        listOfPlaylist = Playlist.query(Playlist.user_id == str(_id)).fetch()
        for i in listOfPlaylist:
            list_of_playlist.append({"Playlist":i.playlistname,
                                    "id":i.key.id()})
        if list_of_playlist == []:
            playlist = "No playlist created"
            return jsonify({"No":playlist})
        return jsonify({"Playlist":list_of_playlist})


@app.route("/playlistsong", methods=['GET', 'POST'])
def playlistsong():
    '''Adding and Displaying the songs in the user playlist'''
    list_of_songs = []
    with db.context():
        try:
            cust_id = session['user']
            user = User.query().fetch()
            for i in user:
                if i.email == cust_id:
                    _id = i.key.id()
        except Exception as e:
            info = "Please log in"
            return jsonify({"info":info})

        if request.method == 'POST':
            res = request.get_json(force=True)
            playlist_id = res.get('playlist_id')
            song_id = res.get('song_id')
            song_name = res.get('songName')
            song_check = PlaylistSong.query(
                PlaylistSong.playlist_id == str(playlist_id)).fetch()
            for i in song_check:
                if i.song_id == song_id:
                    return jsonify({"info":"Song Exists Already!"})
            details = PlaylistSong(playlist_id=str(playlist_id) , 
                                   song_id=str(song_id) ,
                                   user_id=str(_id) , 
                                   song_name=song_name)
            details.put()
            return jsonify({"Success":"Song Added!"})

        if request.method == 'GET':
            id_playlist = request.args.get('playlist_id')
            playlistSongDetails = PlaylistSong.query(
                PlaylistSong.playlist_id == id_playlist).fetch()
            for i in playlistSongDetails:
                list_of_songs.append({"songId":i.song_id, 
                                        "songName":i.song_name})
            return jsonify({"Songs":list_of_songs})
        
@app.route("/deletesong", methods=['DELETE'])
def deletesong():
    '''API call to delete song in the playlist'''
    with db.context():
        delete_song_id = request.args.get('songid')
        playlist_id = request.args.get('playlistid')
        song_det = PlaylistSong.query(PlaylistSong.playlist_id == playlist_id,
                                      PlaylistSong.song_id == delete_song_id).fetch()
        for i in song_det:
            i.key.delete()
        return "Song Deleted!"

@app.route("/deleteplaylist", methods=['DELETE'])
def deleteplaylist():
    '''API call to delete the playlist'''
    with db.context():
        playlist_id = request.args.get('playlistid')
        playlist_det = Playlist.get_by_id(int(playlist_id))
        playlist_det.key.delete()
        song_det = PlaylistSong.query(PlaylistSong.playlist_id == str(playlist_id)).fetch()
        for i in song_det:
            i.key.delete()
        return "Playlist Deleted!"

@app.route("/searchsongs", methods=['GET'])
def searchsongs():
    with db.context():
        search_songs = []
        allSongs = SongsList.query().fetch()
        for i in allSongs:
            search_songs.append({"song":i.song, 
                                "artist": i.artists,
                                "duration": i.duration,
                                "_id":i.key.id()})
        return jsonify({"SongDetails":search_songs})

@app.route("/suggestedprofile", methods=['GET'])
def suggestedprofile():
    with db.context():
        all_profile_list = []
        allProfile = User.query(User.email != session['user']).fetch()
        for i in allProfile:
            all_profile_list.append({
                "email":i.email,
                "name":i.name,
                "user_id":i.key.id()
            })
        return jsonify({"Profile":all_profile_list})

@app.route("/changepassword", methods=['POST'])
def changepassword():
    with db.context():
        user = User.query(User.email==session['user']).get()
        res = request.get_json(force=True)
        old_password = res.get('old')
        new_password = res.get('new')
        confirm_password = res.get('confirm')
        if old_password == new_password:
            return jsonify({"info":"Please don't use old password"})
        elif new_password != confirm_password:
            return jsonify({"info":"Passwords do not match"})
        else:
            user.set_password(new_password)
            user.put()
            return jsonify({"Success":"Password Changed!"})

@app.route("/getprofileplaylist", methods=['GET'])
def getprofileplaylist():
    with db.context():
        get_profile_playlist = []
        res = request.args.get('id')
        playlist = Playlist.query(Playlist.user_id == res).fetch()
        for i in playlist:
            get_profile_playlist.append({
                "name":i.playlistname,
                'id':i.key.id()
            })
        if get_profile_playlist == []:
            return jsonify({"info":"No Playlist Created Yet!"})
        return jsonify({"Playlists": get_profile_playlist})

if __name__ == "__main__":
    app.run(debug=True, port=8080)
