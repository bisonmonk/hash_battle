var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var routes = require('./routes');
var path = require('path');

app.set('view engine', 'jade');
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    res.sendFile('index.html', { root: path.join(__dirname, '/public') });
});

var Twit = require('twit');

var T = new Twit({
    consumer_key:         'fIkgfUekYWkzpYf81Hj4Eb8YQ',
    consumer_secret:      '8SYX5d8HBjU7aE8wRgChgxEzXz9Kva8E1wCDQmwyX6Hf8wl3UX',
    access_token:         '2457187326-JS7S7fGEMCGbCiTqHFEUdTMJ0PITlUUcHeA51yR',
    access_token_secret:  'I2tgfJjs0kjuzVnVSokH7CuzrKmtBmvwasbn6G8VB0eMZ'
});

io.on('connection', function(socket) {
    console.log('connected');
    socket.on('submit hashtags', function(str) {
        var hashtags = str.toLowerCase().split(' ');
        hashtags.forEach(function(tag) {
            tag = "#" + tag;
        });
        var stream = T.stream('statuses/filter', { track: hashtags });
        stream.on('tweet', function(tweet) {
            console.log("new tweet");
            var data = {};
            data['text'] = tweet.text;
            for (var i = 0; i < hashtags.length; i++) {
                if (tweet.text.toLowerCase().indexOf(hashtags[i]) > -1) {
                    data['hashtag'] = hashtags[i];
                    break;
                }
            }
            io.emit('tweet', data);
        });
    });
    
    io.on('disconnect', function() {
       stream.stop(); 
    });
});

http.listen(process.env.port, function(){
  console.log(process.env.port);
});
