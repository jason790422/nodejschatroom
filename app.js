var express = require('express');
var path    = require('path');
var favicon = require('serve-favicon');
var logger  = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');

var routes = require('./routes/index');
var users  = require('./routes/users');

var app  = express();
var http = require('http').Server(app);
var io   = require('socket.io')(http);
// app.get('/', function(req, res){
//   res.sendFile(__dirname + '/index.html');
// });

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});

var user_count = 0;
var pic_url = ["dist/img/user1-128x128.jpg", "dist/img/user2-160x160.jpg", "dist/img/user3-128x128.jpg", "dist/img/user4-128x128.jpg", "dist/img/user5-128x128.jpg", "dist/img/user6-128x128.jpg", "dist/img/user7-128x128.jpg", "dist/img/user8-128x128.jpg"];
var namedata = [];
var picdata  = [];
var alluser = [];
//當新的使用者連接進來的時候
io.on("connection", function(socket) {

	//新user
	socket.on("add user", function(msg) {

		if (namedata.indexOf(msg) != -1) {
		}
		else {
			console.log("server:"+msg);
			obj = JSON.parse(msg);
			//過濾語法
			// var pic = Math.floor((Math.random() * 6));
			// var msg = toBr(msg);
			socket.username = obj.name;
			socket.pic  = obj.pic;
			socket.uuid = obj.uuid;
			console.log("new user:"+socket.username+" logged.");
			console.log("new user's pic:"+socket.pic);
			console.log("new user's uuid:"+socket.uuid);

			//回傳給html
			io.emit("add user",{
				userData: msg
			});

			alluser.push(msg);
			namedata.push(socket.username);
			picdata.push(socket.pic);
			updateAllData();
		}
	});

	// 更新使用者
	function updateAllData() {
		io.emit("all users", {
			alluser: alluser
		});
	}

	//監聽新訊息事件
	socket.on("chat message", function(msg) {
		//過濾語法
		var msg = toBr(msg);
		var re = /^::\d+\.[a-z]{3}::/g;
		var hl = /^(http|https):/g;
		if ( re.test(msg) ) {
			var num = msg.split("::");
			msg = "<img src='images/"+num[1]+"'>";
		}
		console.log(socket.username+":"+msg);
		console.log("pic:"+socket.pic);
		console.log("uuid:"+socket.uuid);
		var chat = {};
		chat.name = socket.username;
		chat.pic  = socket.pic;
		chat.uuid = socket.uuid;
		chat.msg  = msg;
		var json = JSON.stringify(chat);
		//回傳給html，發佈新訊息
		io.emit("chat message", {
			chat: json
		});
	});

	//left
	socket.on("disconnect",function() {
		console.log(socket.username + " left.");
		var userleft = {};
		userleft.name = socket.username;
		userleft.pic  = socket.pic;
		userleft.uuid = socket.uuid;
		var json = JSON.stringify(userleft);
		io.emit("user left", {
			userleft: json
		});
		alluser.splice(alluser.indexOf(socket.alluser), 1);
		updateAllData();
	});
});

function toBr(v) {
	var encodedStr = v.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
		return '&#'+i.charCodeAt(0)+';';
	});
	encodedStr = encodedStr.replace(/(?:\r\n|\r|\n)/g, '<br/>');
	return encodedStr;
}

function guid() {
	return s4() + s4() + s4();
}

function s4() {
	return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
}

module.exports = app;
// app.listen("5000");
//指定port
http.listen(process.env.PORT || 5000, function(){
  console.log('listening on *:5000');
});