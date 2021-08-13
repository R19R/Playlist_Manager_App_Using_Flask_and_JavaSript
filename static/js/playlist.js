/* JavaScript to upload read songs from a local file and upload it to DB.

window.onload = function(){
  var xhr = new XMLHttpRequest();
  xhr.open('GET', "/toDb", true);
  xhr.send(null);

  xhr.onload = function(){
    if(this.status == 200){
      var list = JSON.parse(this.responseText);
      for (i=0;i < list.length; i++){
        var song = list[i].Song;
        var artist = list[i].Artists;
        var duration = list[i].Duration;
        songlist(song, artist, duration);
      }
    }
  }
}

function songlist(song, artist, duration){

  var song_details = JSON.stringify({song:song, artist:artist, duration:duration})

  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/songlist", true);
  xhr.send(song_details);

  xhr.onload = function(){
    if (this.status == 200){
      console.log(this.responseText);
    }
  }
} */

// document
//   .getElementById("loginGeneral")
//   .addEventListener("click", checkUser);

// checking whether it is user or admin
function checkUser(e) {
  e.preventDefault();

  var who = document.getElementsByName("who");

  for (i = 0; i < who.length; i++) {
    if (who[i].checked) {
      if (who[i].value == "User") {
        userLogin();
      } else {
        adminLogin();
      }
    }
  }

  if ($("input[name=who]:checked").length === 0) {
    alert("Please select User or Admin");
  }
}

// user login
async function userLogin() {
  let log_mail = document.getElementById("emailLogin").value;
  let log_pword = document.getElementById("passwordLogin").value;

  let log_det = JSON.stringify({ Mail: log_mail, Password: log_pword });

  let requestSettings = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: log_det,
  }
  let request = await fetch("/login", requestSettings);
  let response = await request.json();
  
  if (response.No) {
    interval_set("No Email registered");
  } else if (response.credentials) {
    interval_set("Wrong Credentials");
  } else {
    setTimeout(css(response.Name), 3000);
    showPlaylist();
  }
}

// admin login
async function adminLogin() {
  let log_mail = document.getElementById("emailLogin").value;
  let log_pword = document.getElementById("passwordLogin").value;

  let admin_log_det = JSON.stringify({ Mail: log_mail, Password: log_pword });

  let requestSettings = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: admin_log_det,
  };
  let request = await fetch("/admin/login", requestSettings);
  let response = await request.json();

  if (response.Success) {
    adminLoginCss();
  }
  if (response.No) {
    alert(response);
  }
  if (response.error) {
    alert(response.error + " Please Login as User!");
  }
  if (response.credentials) {
    alert(response.credentials);
  }
}

function adminLoginCss() {
  var login = (document.getElementById("login").style.display = "none");
  var loginMsg = (document.getElementById("login_msg").style.display = "none");
  var profile = (document.getElementById("userProfile").style.display = "none");
  var welcome = (document.getElementById("userWelcome").style.display = "none");
  var songlist = (document.getElementById("songList").style.display = "none");
  var logout = (document.getElementById("logout").style.display = "block");
  var admin = (document.getElementById("admin").style.display = "block");
  var newAdmin = (document.getElementById("newAdmin").style.display = "block");
  var profilePage = (document.getElementById("profilePage").style.display =
    "none");
}

// add new admin

function newAdminCss() {
  var admin = (document.getElementById("admin").style.display = "none");
  var newadmin = (document.getElementById("newAdmin").style.display = "none");
  var admin_reg_form = (document.getElementById(
    "adminRegisterForm"
  ).style.display = "block");
  var backToAdminPage = (document.getElementById(
    "backToAdminPage"
  ).style.display = "block");
}

function backToAdminPage() {
  var admin = (document.getElementById("admin").style.display = "block");
  var newadmin = (document.getElementById("newAdmin").style.display = "block");
  var admin_reg_form = (document.getElementById(
    "adminRegisterForm"
  ).style.display = "none");
  var backToAdminPage = (document.getElementById(
    "backToAdminPage"
  ).style.display = "none");
}

document.getElementById("addAdminBtn").addEventListener("click", addNewAdmin);

async function addNewAdmin(e) {
  e.preventDefault();

  let name = document.getElementById("newAdmin_name").value;
  let email = document.getElementById("newAdmin_email").value;
  let pword = document.getElementById("newAdmin_pword").value;
  let confirm = document.getElementById("newAdmin_con_pword").value;

  let new_admin_det = JSON.stringify({
    name: name,
    email: email,
    pword: pword,
    confirm: confirm,
  });

  let requestSettings = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: new_admin_det,
  };

  if (email === "" || pword === "" || confirm === "" || name === "") {
    alert("Credentials cannot be empty!");
  } else {
    let request = await fetch("/admin/newadmin", requestSettings);
    let response = await request.text();

    if (response == "Passwords doesn't match") {
      alert(response);
    } else if (response == "Please enter a valid email") {
      alert(response);
    } else if (response == "Admin Already Registered! Please Log In") {
      alert(response);
    } else if (response == "Admin Added!") {
      backToLoginPage();
      alert("Admin Added!. Log In with Your Credentials!");
    } else {
      console.log("Error!");
    }
  }
}

function backToLoginPage() {
  var login = (document.getElementById("login").style.display = "block");
  var songs = (document.getElementById("songList").style.display = "block");
  var logout = (document.getElementById("logout").style.display = "none");
  var adminForm = (document.getElementById("adminRegisterForm").style.display =
    "none");
  var bactToAdminPage = (document.getElementById(
    "backToAdminPage"
  ).style.display = "none");
  var email = (document.getElementById("emailLogin").value = null);
  var password = (document.getElementById("passwordLogin").value = null);
}

// admin add songs

document.getElementById("admin-btn").addEventListener("click", adminAddSong);

async function adminAddSong(e) {
  e.preventDefault();

  let song = document.getElementById("adminSongName").value;
  let artist = document.getElementById("adminArtists").value;
  let duration = document.getElementById("adminDuration").value;

  let details = JSON.stringify({
    song: song,
    artist: artist,
    duration: duration,
  });

  if (song === "" || artist === "" || duration === "") {
    alert("Values cannot be empty.");
  } else {
    let requestSettings = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: details,
    };
    let request = await fetch("/admin/addsong", requestSettings);
    let response = await request.text();

    if (response === "Song Added into Db") {
      alert("Song Added Into Database!");
      let song = (document.getElementById("adminSongName").value = null);
      let artist = (document.getElementById("adminArtists").value = null);
      let duration = (document.getElementById("adminDuration").value = null);
    }
  }
}

// set interval function

let interval = 1;
function interval_set(text) {
  if (interval == 1) {
    let set_interval = setInterval(() => {
      document.getElementById("flash").innerHTML = text;
      document.getElementById("msg").style.display = "block";
      interval++;
      if (interval > 5) {
        clearInterval(set_interval);
        document.getElementById("emailLogin").value = null;
        document.getElementById("passwordLogin").value = null;
        document.getElementById("msg").style.display = "none";
        interval = 1;
      }
    }, 1000);
  }
}

// playlist function
var playlist_cursor = null;

async function showPlaylist() {
  let request = await fetch("/getplaylistname");
  let response = await request.json();
  let data = await response;

  if (data.info) {
    console.log(data.info);
  } else if (data.information) {
    alert("Create New Playlist");
  } else {
    for (i = 0; i < data.Playlists.length; i++) {
      var names = data.Playlists[i].Playlist;
      var id = data.Playlists[i].Playlist_id;
      addPlaylist(names, id);
    }
  }
}

// self-invoking function
(showPlaylist)();

// function showPlaylistCursorFunc() {
//   var xhr1 = new XMLHttpRequest();
//   xhr1.open("GET", "/getplaylistname?cursor="+ playlist_cursor, true);
//   xhr1.send();

//   xhr1.onload = function () {
//     if (this.status == 200) {
//       var playlist_det = JSON.parse(this.responseText);
//       req_test = false;
//       if (playlist_det.Success) {
//         req_test = true;
//       } else {
//         for (i = 0; i < playlist_det.Playlists.length; i++) {
//           var names = playlist_det.Playlists[i].Playlist;
//           var id = playlist_det.Playlists[i].Playlist_id;
//           addPlaylist(names, id);
//         }
//       }
//       playlist_cursor = playlist_det.cursor;
//     }
//   };
// }

// showing playlist profile css
function css(text) {
  var login = (document.getElementById("login").style.display = "none");
  var loginMsg = (document.getElementById("login_msg").style.display = "none");
  var profile = (document.getElementById("userProfile").style.display =
    "block");
  var welcome = (document.getElementById("userWelcome").style.display =
    "block");
  var logout = (document.getElementById("logout").style.display = "block");
  var profilePage = (document.getElementById("profilePage").style.display =
    "block");

  var userWelcom = document.getElementById("welcomeUser");
  userWelcom.innerHTML = "Welcome " + text;
}
let id = null;
function createPlaylist() {
  var playlistName = prompt("Enter the name for your playlist");
  if (playlistName === "") {
    alert("Playlist name cannot be empty!");
    return;
  } else if (playlistName === null) {
    return;
  }
  setTimeout(alert("Playlist Created! Add songs!"), 2000);
  addingPlaylist(playlistName);
}

async function addingPlaylist(arg) {
  var name_obj = JSON.stringify({ Playlist: arg });

  let requestSettings = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: name_obj,
  };
  let request = await fetch("/playlistname", requestSettings);
  let response = await request.json();
  let data = await response;

  if(data.id){
    id = data.id;
  }
  addPlaylist(arg, id);
}

// playlist creation done
document.getElementById("doneBtn").addEventListener("click", backToProfilePage);

function backToProfilePage() {
  document.getElementById("playlistProfile").style.display = "none";
  document.getElementById("playlistList").style.display = "block";

  var table = document.getElementById("playlistSongs-table");
  $("#playlistSongs-table tr").remove();
}

// adding playlist to the list
var row1 = 1;

function addPlaylist(text, id) {
  let table = document.getElementById("list");
  let newRow = table.insertRow(row1);

  let cell0 = newRow.insertCell(0);
  let delete_button = newRow.insertCell(1);

  cell0.innerHTML = text;
  cell0.style.width = "150px";

  cell0.onclick = () => {
    playlistSong(id);
    document.getElementById("playlistList").style.display = "none";
    document.getElementById("playlistProfile").style.display = "block";
    document.getElementById("playlistTitle").innerHTML = text;
    document.getElementById("doneBtn").style.display = "block";
  }
  delete_button.innerHTML =`<button onclick=deletePlaylist(${id},this) \
                          value='button' id='del-btn' class='del-btn-class'> \
                          <i class='fas fa-trash-alt'></i> </button>`;
  row1++;
}

// retrieving songs from DB
document.addEventListener("DOMContentLoaded", readSongs);

let cursor = null;

async function readSongs() {
  let request = await fetch("/readsongs");
  let response = await request.json();
  let data = await response;

  if (data.songDetails) {
    for (i = 0; i < data.songDetails.length; i++) {
      let songs = data.songDetails[i].songs;
      let artists = data.songDetails[i].artist;
      let duration = data.songDetails[i].duration;
      let _id = data.songDetails[i]._id;
      songListTable(songs, artists, duration, _id);
    }
    cursor = data.cursor;
  }
}

// cursor value

async function cursorFunc() {
  let request = await fetch("/readsongs?cursor=" + cursor);
  let response = await request.json();
  let data = await response;

  req_test = false;

  if (data.Success) {
    req_test = true;
  } else {
    for (i = 0; i < data.songDetails.length; i++) {
      let songs = data.songDetails[i].songs;
      let artists = data.songDetails[i].artist;
      let duration = data.songDetails[i].duration;
      let _id = data.songDetails[i]._id;
      songListTable(songs, artists, duration, _id);
    }
  }
  cursor = data.cursor;
}

// song list table
var row2 = 0;
var dummyPlaylistId = null;

function songListTable(t1, t2, t3, t4) {
  var table = document.getElementById("listSongs-table-tbody");
  var newRow = table.insertRow(row2);

  var cell_songname = newRow.insertCell(0);
  var cell_artist = newRow.insertCell(1);
  var cell_duration = newRow.insertCell(2);
  cell_button = newRow.insertCell(3);

  var songId = t4;
  var sn = t1;

  cell_songname.innerHTML = t1;
  cell_artist.innerHTML = t2;
  cell_duration.innerHTML = t3;
  cell_button.innerHTML = `<button onclick=addTo('${songId}','${sn}','${dummyPlaylistId}') \
                            value='button' id='button-btn' class='button-class'> \
                            <i class='fa fa-plus'></i> </button>`;

  row2++;
}

// infinte scroll

var table = document.getElementById("listSongs");
table.addEventListener("scroll", scrollTable);

var req_test = false;

function scrollTable() {
  var table1 = document.getElementById("listSongs-table");

  var scrollHeight = table1.scrollHeight;
  var scrollTop = table1.scrollTop;
  var clientHeight = table1.clientHeight;

  if (scrollHeight - scrollTop == clientHeight) {
    if (!req_test) {
      req_test = true;
      cursorFunc();
    }
  }
}

// infinte scroll for playlist list
// var playlistTable = document.getElementById('table-container');

// playlistTable.addEventListener("scroll", playlistScrollTable);

// function playlistScrollTable(){

//   var table = document.getElementById("list");

//   var scrollHeight = table.scrollHeight;
//   var scrollTop = table.scrollTop;
//   var clientHeight = table.clientHeight;

//   if (scrollHeight - scrollTop == clientHeight) {
//     if (!req_test) {
//       req_test = true;
//       showPlaylistCursorFunc();
//     }
//   }
// }

var listOfPlaylist = null;
var listOfPlaylist_id = null;

async function addTo(songId, songName, dummyPlaylistId) {

  let request = await fetch("/addto");
  let response = await request.json();
  let data = await response;

  if (data.Playlist) {
    for (i = 0; i < data.Playlist.length; i++) {
      listOfPlaylist = data.Playlist[i].Playlist;
      listOfPlaylist_id = data.Playlist[i].id;
      if (listOfPlaylist_id != dummyPlaylistId){
        addToBtn(listOfPlaylist, listOfPlaylist_id, songId, songName);
      }
    }
  } else {
    alert("Please Log In!");
  }
}

function addToBtn(listOfPlaylist, listOfPlaylist_id, song_id, songName) {
  
  var id_song = song_id;
  var tests = listOfPlaylist;
  var playlist_id = listOfPlaylist_id;

  var span = document.getElementsByClassName("close")[0];
  span.onclick = function () {
    modal.style.display = "none";
    $(".modal-content ul").remove();
  };

  var ordered = document.createElement("ul");
  ordered.setAttribute("class", "ul-class");
  var select = document.getElementsByClassName("modal-content")[0];
  var list = document.createElement("li");
  var pTag = document.createElement("p");
  pTag.setAttribute("class", "pTag");

  if (tests != null) {
    var modal = document.getElementById("modalId");
    if (!modal){
      modal = document.getElementById("profilePageModalId");
      modal.style.display='block';
    }
    modal.style.display = "block";
    pTag.innerHTML = tests;
    list.onclick = () => toPlaylist(playlist_id, id_song, songName);
    list.append(pTag);
    ordered.append(list);
    select.append(ordered);
  }
}
// var interval_set_time = 1;

async function toPlaylist(playlist_id, song_id, songName) {
  let details = JSON.stringify({
    playlist_id: playlist_id,
    song_id: song_id,
    songName: songName,
  });

  let requestSettings = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: details,
  };
  let request = await fetch("/playlistsong", requestSettings);
  let response = await request.json();
  let data = await response;

  if (data.Success) {
    alert(data.Success);
  } else {
    alert(data.info);
  }
}

async function playlistSong(Playlistid) {

  let request = await fetch("/playlistsong?playlist_id=" + Playlistid);
  let response = await request.json();
  let data = await response;

  if (data.Songs) {
    if (data.Songs.length === 0) {
      alert("Empty Playlist. Please add Songs");
    } else {
      for (i = 0; i < data.Songs.length; i++) {
        let songs_name = data.Songs[i].songName;
        let song_id = data.Songs[i].songId;
        playlistSongTable(songs_name, song_id, Playlistid);
      }
    }
    playlistSong_cursor = data.cursor;
    playlistSong_id = Playlistid;
  }
}

// function playlistSongCursor() {
//   var xhr = new XMLHttpRequest();
//   xhr.open("GET", "/playlistsong?playlist_id="+playlistSong_id+"&cursor="+playlistSong_cursor, true);
//   xhr.send(null);

//   xhr.onload = () => {
//     if (xhr.status == 200) {
//       var det = JSON.parse(xhr.responseText);
//       console.log(det);
//       playlistSong_req = false;
//       if (det.Songs.length == 0) {
//         alert("Empty Playlist. Please add Songs");
//       } else {
//         for (i = 0; i < det.Songs.length; i++) {
//           var songs_name = det.Songs[i].songName;
//           var song_id = det.Songs[i].songId;
//           playlistSongTable(songs_name, song_id, Playlistid);
//         }
//       }
//       if (det.Success){
//         playlistSong_req = true;
//       }
//       playlistSong_cursor = det.cursor;
//       playlistSong_id = playlistSong_id;
//     }
//   };
// }

var playlistSongTableRow = 0;

function playlistSongTable(songs_name, song_id, Playlistid) {
  var table = document.getElementById("playlistSongs-table");
  var newRow = table.insertRow(table.length);

  var cell_songname = newRow.insertCell(0);
  var del_button = newRow.insertCell(1);

  cell_songname.innerHTML = songs_name;
  cell_songname.style.width = "150px";
  del_button.innerHTML = `<button onclick=deleteSong('${song_id}','${Playlistid}',this) \
                          value='button' id='del-btn' class='del-btn-class'> \
                          <i class='fas fa-trash-alt'></i> </button>`;

  playlistSongTableRow++;
}

// infinte scroll for PlaylistSong
// var playlistSong_table = document.getElementById('playlistSongs');
// playlistSong_table.addEventListener("scroll", playlistSongScroll);

// var playlistSong_req = false;
// function playlistSongScroll(){

//   var table = document.getElementById("playlistSongs-table");

//   var scrollHeight = table.scrollHeight;
//   var scrollTop = table.scrollTop;
//   var clientHeight = table.clientHeight;

//   if (scrollHeight - scrollTop == clientHeight) {
//     if (!playlistSong_req) {
//       playlistSong_req = true;
//       playlistSong(playlistSong_id);
//     }
//   }
// }

async function deleteSong(song_id, Playlistid, r) {

  let request = await fetch(
    "/deletesong?songid=" + song_id + "&playlistid=" + Playlistid,
    { method: "DELETE" }
  );
  let response = await request.text();

  if (response === "Song Deleted!") {
    alert(response);
  }
  var playlistSongsTable = document.getElementById("playlistSongs-table");

  var i = r.parentNode.parentNode.rowIndex;
  var tableIndex = playlistSongsTable.deleteRow(i);
  if (playlistSongsTable.rows.length === 0) {
    backToProfilePage();
  }
}
async function deleteProfilePlaylistSong(song_id, Playlistid, r) {

  let request = await fetch(
    "/deletesong?songid=" + song_id + "&playlistid=" + Playlistid,
    { method: "DELETE" }
  );
  let response = await request.text();

  if (response === "Song Deleted!") {
    alert(response);
  }
  var profilePagePlaylistTable = document.getElementById("profilePagePlaylistTable");
  
  var i = r.parentNode.parentNode.rowIndex;
  var table_inde = profilePagePlaylistTable.deleteRow(i);

  playlistSongCount--;
  document.getElementById("playlistCount").innerHTML = "Total Songs: "+ playlistSongCount;

  if(profilePagePlaylistTable.rows.length === 0){
    alert("No more songs to Display!");
  }
}


// delete Playlist 
async function deletePlaylist(Playlistid, r) {

  let request = await fetch(
    "/deleteplaylist?playlistid=" + Playlistid,
    { method: "DELETE" },
  )
  let response = await request.text();

  if (response === "Playlist Deleted!") {
    if(confirm("Are you sure?")){ 
    } else {
      return
    }
  }
  let i = r.parentNode.parentNode.rowIndex;
  let table_index = document.getElementById("list").deleteRow(i);
}

let timer = null;
function searchSongsTimer(){
      clearTimeout(timer);
      timer = setTimeout(searchSongs, 500);
}

async function searchSongs(){
  let value = document.getElementById("searchBar").value;
  if( value !== ''){
    let request = await fetch("/searchsongs");

    let response = await request.json();
    let data = await response;

    if(data.SongDetails){
      $("#listSongs-table-tbody tr").remove();
      row2 = 0;   
      for(i=0; i < data.SongDetails.length; i++){
        var song =  data.SongDetails[i].song;
        var artist =  data.SongDetails[i].artist;
        var duration =  data.SongDetails[i].duration;
        var id =  data.SongDetails[i]._id;
        if (song.includes(value) || artist.includes(value)){
            songListTable(song, artist, duration, id);    
        }
        }
      }
      document.getElementById("backToSongList").style.display="block";
    }else{
    backToSongs();
  }
}

function backToSongs(){
  row2 = 0;
  readSongs();
  document.getElementById("backToSongList").style.display="none";
  document.getElementById("searchBar").value='';
}

// user's profile
var totalPlaylist = null;
var userEmail = null; 
async function profilePage(){
  profilePageDisplay();
  suggestedProfile();
  removeElements();

  let request = await fetch("/getplaylistname");
  let response = await request.json();
  let data = await response;

  if (data.Playlists){
    totalPlaylist = data.Playlists.length;
    if (data.name != null){
      userEmail = data.name;
    } else {
      userEmail = data.email;
    }
    document.getElementById("playlistCount").innerHTML="Total Playlists: "+ totalPlaylist;
    document.getElementById("userName").innerHTML=userEmail;
    for(i=0;i<data.Playlists.length;i++){
      let playlist = data.Playlists[i].Playlist;
      let playlist_id = data.Playlists[i].Playlist_id;
      userPlaylists(playlist, playlist_id);
    }
  } else {
    alert("Please create Playlist");
  }
}
function removeElements(){
  let classPresent = document.getElementsByClassName("playlistBox");
  if (classPresent){
    $(".playlistBox").remove();
  }
  let suggestedProfilePresent = document.getElementsByClassName("suggestedProfile-text");
  if(suggestedProfilePresent){
    $(".suggestedProfile-text").remove();
  }
}
function profilePageDisplay(){
  document.getElementById("userWelcome").style.display = 'none';
  document.getElementById("songList").style.display = 'none';
  document.getElementById("userProfile").style.display = 'none';
  document.getElementById("profilePage").style.display = 'none';
  document.getElementById("playlistProfile").style.display = 'none';
  document.getElementById("yourProfile").style.display = 'none';
  document.getElementById("backToUserPage").style.display = 'none';
  document.getElementById("profileContainer").style.display = 'block';
  document.getElementById("Password").style.display = 'block';
  document.getElementById("suggestion").style.display = 'block';
  document.getElementById("homePage").style.display = 'block';

  let checkProfilePlaylist = document.getElementById('profilePagePlaylist');
  if(checkProfilePlaylist){
    checkProfilePlaylist.style.display='none';
    document.getElementById("userPlaylists").style.display='block';
    document.getElementById("backToProfileSection").style.display='none';
  }
}

function userPage(){
  document.getElementById("songList").style.display = 'block';
  document.getElementById("userProfile").style.display = 'block';
  document.getElementById("profilePage").style.display = 'block';
  document.getElementById("backToUserPage").style.display = 'none';
  document.getElementById("profileContainer").style.display = 'none';
  document.getElementById("homePage").style.display = 'none';
  document.getElementById("suggestion").style.display = 'none';
}

function yourProfile(){
  profilePageDisplay();
  profilePage();
}

function userPlaylists(text, playlistId){
  let userPlaylistId = document.getElementById("userPlaylists");
  let div = document.createElement('div');
  div.setAttribute("class", "playlistBox");
  div.onclick = () => { playlistProfilePageDisplay(playlistId, text)};
  let p = document.createElement('p');
  p.setAttribute("id", "playlistBoxText");
  p.innerHTML=text;
  div.appendChild(p);
  userPlaylistId.appendChild(div);
}

var playlistSongCount = 0;
async function playlistProfilePageDisplay(playlistId, text){

  let playlist_id = playlistId;

  let request = await fetch("/playlistsong?playlist_id=" + playlist_id);
  let response = await request.json();
  let data = await response;

  if (data.Songs) {
    if (data.Songs.length === 0) {
      alert("Empty Playlist. Please add Songs");
    } else {
      profilePagePlaylistTableRow = 0;
      playlistSongCount = data.Songs.length;
      document.getElementById("userName").innerText=text;
      document.getElementById("playlistCount").innerText="Total Songs: "+ playlistSongCount;
      playlistProfilePageDisplayCSS();
      for (i = 0; i < data.Songs.length; i++) {
        let songs_name = data.Songs[i].songName;
        let song_id = data.Songs[i].songId;
        profilePagePlaylistTable(songs_name, song_id, playlist_id);
      }
    }
  }
}
function playlistProfilePageDisplayCSS(){
  let tableBody =  $('#profilePagePlaylistTable tbody tr');
  if(tableBody){
    tableBody.remove();
  }
  document.getElementById("userPlaylists").style.display='none';
  document.getElementById("backToUserPage").style.display='none';
  document.getElementById("profilePagePlaylist").style.display='block';
  document.getElementById("backToProfileSection").style.display='block';  
}

var profilePagePlaylistTableRow = 0;

function profilePagePlaylistTable(songs_name, song_id, playlist_id){
  let table = document.getElementById("profilePagePlaylistTable");
  let row = table.insertRow(profilePagePlaylistTableRow);
  let cell = row.insertCell(0);
  let cell2 = row.insertCell(1);
  let cell3 = row.insertCell(2);

  cell.innerHTML=songs_name;
  cell2.innerHTML=`<button value='button' class='plusButton' \
                    onclick=addTo('${song_id}','${songs_name}','${playlist_id}')> \
                    <i class='fa fa-plus'></i> </button>`;
  cell2.style.width='100px';
  cell3.innerHTML=`<button onclick=deleteProfilePlaylistSong('${song_id}','${playlist_id}',this) \
                    value='button' id='del-btn' class='del-btn-class'> \
                    <i class='fas fa-trash-alt'></i> </button>`;
  cell3.style.width='100px';
  
  profilePagePlaylistTableRow++;
}

// back to profile section
function backToProfileSectionJS(){
  document.getElementById("userPlaylists").style.display='block';
  document.getElementById("suggestedProfileText").style.display='block';
  document.getElementById("suggestedProfileText").innerHTML="Suggested Profile";
  document.getElementById("suggestedProfileText").style.marginBottom="2%";
  document.getElementById("suggestedProfiles").style.display='block';
  document.getElementById("backToUserPage").style.display='block';
  document.getElementById("profilePagePlaylist").style.display='none';
  document.getElementById("backToProfileSection").style.display='none';
  document.getElementById("backToUserPage").style.display='none';

  $(".suggestedProfile-text").remove();
  suggestedProfile();
    
  // $("#profilePagePlaylistTable tbody tr").remove();
  // profilePage();
  // profilePagePlaylistTableRow = 0;
}

// suggested Profiles

async function suggestedProfile(){
  let request = await fetch("/suggestedprofile");
  let response = await request.json();
  let data = await response;

  const shuffleArray = [];

  if(data.Profile){
    for(i=0;i<data.Profile.length;i++){
      shuffleArray.push(data.Profile[i]);
    }
    let shuffleResult = shuffle(shuffleArray);
    for(i=0;i<6;i++){
      let email = shuffleResult[i].email;
      let id = shuffleResult[i].user_id;
      suggestedProfileDisplay(email, id);
    }
  }
}
function shuffle(array){
  return array.sort(()=> Math.random() - 0.5);
}
function suggestedProfileDisplay(text, id){
  let userPlaylistId = document.getElementById("suggestedProfiles");
  let div = document.createElement('div');
  div.setAttribute("class", "suggestedProfile-text");
  div.onclick = () => {
    getProfilePlaylists(id, text);
  }
  let p = document.createElement('p');
  p.setAttribute("id", "playlistBoxText");
  p.innerHTML=text;
  div.appendChild(p);
  userPlaylistId.appendChild(div);
}

function changePassword(){
  document.getElementById("userPlaylists").style.display='none';
  document.getElementById("suggestedProfileText").style.display='none';
  document.getElementById("suggestedProfiles").style.display='none';
  document.getElementById("backToUserPage").style.display='none';
  document.getElementById("changePasswordForm").style.display='block';
  document.getElementById("backToUserProfilePage").style.display='block';
}

function backToUserProfilePage(){
  profilePage();
}

document
 .getElementById('passwordBtn')
 .addEventListener("click", passwordChange);

async function passwordChange(e){
  e.preventDefault();

  let old_pword = document.getElementById("user_old_pword");
  let new_pword = document.getElementById("user_new_pword");
  let confirm = document.getElementById("confirm_new_pword");
  
  let details = JSON.stringify({old:old_pword.value, new:new_pword.value, confirm:confirm.value});

  let requestSettings = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: details,
  }
  let request = await fetch("/changepassword", requestSettings);
  let response = await request.json();

  if (response.Success){
    setTimeout(() => {alert(response.Success);
    old_pword.value="";
    new_pword.value="";
    confirm.value="";}, 1000);
  } else {
    alert(response.info);
  }
}
var suggestProfilePlaylistCount = null;
var suggestProfilePlaylistName = null;
async function getProfilePlaylists(id, text){

  let request = await fetch("/getprofileplaylist?id="+ id);
  let response = await request.json();
  let data = await response;

  if (data.Playlists){
    $(".playlistBox").remove();
    profilePagePlaylistTableRow = 0;
    let length = data.Playlists.length;
    getProfilePlaylistsCSS(length, text);
    for(i=0;i<data.Playlists.length;i++){
      let name = data.Playlists[i].name;
      let _id = data.Playlists[i].id;
      userPlaylists(name, _id);
    }
    $(".suggestedProfile-text").remove();
    suggestedProfile();
    }else {
      alert(data.info);
    }
}

function getProfilePlaylistsCSS(length, text){
  document.getElementById("playlistCount").innerText="Total Playlist: "+length;
  document.getElementById("userName").innerText=text;
  document.getElementById("profilePagePlaylist").style.display='none';
  document.getElementById("userPlaylists").style.display='block';
  document.getElementById("homePage").style.display='block';
  document.getElementById("yourProfile").style.display='block';
}

function homePage(){
  document.getElementById("homePage").style.display='none';
  document.getElementById("backToUserPage").style.display='none';
  document.getElementById("profileContainer").style.display='none';
  document.getElementById("suggestion").style.display='none';
  document.getElementById("backToProfileSection").style.display='none';
  document.getElementById("Password").style.display='none';
  document.getElementById("profilePage").style.display='block';
  document.getElementById("songList").style.display='block';
  document.getElementById("userProfile").style.display='block';
  document.getElementById("userWelcome").style.display='block';
}