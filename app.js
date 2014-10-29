var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

app.set('view engine', 'jade');
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    res.sendFile('index.html', { root: path.join(__dirname, '/public') });
});

var Twit = require('twit');

var T = new Twit({
    consumer_key:         process.env.consumer_key,
    consumer_secret:      process.env.consumer_secret,
    access_token:         process.env.access_token,
    access_token_secret:  process.env.access_token_secret
});

io.on('connection', function(socket) {
    socket.on('submit hashtags', function(str) {
        var hashtags = str.toLowerCase().split(' ');
        hashtags.forEach(function(tag) {
            tag = "#" + tag;
        });
        var stream = T.stream('statuses/filter', { track: hashtags });
        stream.on('tweet', function(tweet) {
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

http.listen(process.env.PORT || 3000, function(){
  console.log(process.env.PORT);
});
