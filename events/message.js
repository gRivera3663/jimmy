// prefix for commands
const prefix = "$"

// Library requirements
const { MessageAttachment, Message } = require("discord.js")
const ytdl = require("ytdl-core")
const got = require('got')
const jsdom = require('jsdom')
const { JSDOM } = jsdom
const yts = require("yt-search")

// Steam Options for YTDL
const streamOptions = {
    format: "audioonly",
    quality: "highestaudio"
}

// Pictures for $pic
const jimmyPics = [
    new MessageAttachment('img/jimmy1.jpg'),
    new MessageAttachment('img/jimmy2.jpg'),
    new MessageAttachment('img/jimmy3.jpg'),
    new MessageAttachment('img/jimmy4.jpg'),
    new MessageAttachment('img/jimmy5.jpg'),
    new MessageAttachment('img/jimmy6.jpg'),
    new MessageAttachment('img/jimmy7.jpg'),
    new MessageAttachment('img/jimmy8.png'),
    new MessageAttachment('img/jimmy9.jpg'),
    new MessageAttachment('img/jimmy10.jpg'),
    new MessageAttachment('img/jimmy11.jpg'),
    new MessageAttachment('img/jimmy12.jpg'),
    new MessageAttachment('img/jimmy13.gif'),
    new MessageAttachment('img/jimmy14.gif'),
    new MessageAttachment('img/jimmy15.gif'),
    new MessageAttachment('img/jimmy16.gif'),
    new MessageAttachment('img/jimmy17.gif')
]

// List of commands that admins can use
const adminCommands = [
    "controls",
    "message",
    "status",
    "clear"
]

// Music queue variables
var queueTracker = 0            // keeps track of the # of songs requested
var currentSongTracker = 0      // keeps track of the current song on the queue
const queue = new Map()         // map variable to hold queue positions (numbering), title of song, and link to YT


// Used to send Steam deals to the server via isthhereanydeal.com
function getGameSales(message){
    const mainLink = "https://isthereanydeal.com/#/filter:steam;/options:mature";
    var sales = [];

    got(mainLink).then(response => {
        const dom = new JSDOM(response.body);
        dom.window.document.querySelectorAll('#games').forEach(e => {
            e.querySelectorAll('.title').forEach(j => {
                var x = String(j.querySelector('a').textContent);
                sales.push(x);
            });
            var msg = "Today's Most Popular Deals on Steam:\n----------------------------------\n";
            for (var i = 0; i < 10; i++){
                msg += sales[i] + "\n";
                console.log(sales[i]);
            }
            msg += "----------------------------------\nView more deals here: https://isthereanydeal.com/#/filter:steam;/options:mature"
            
            message.channel.send(msg);
        });
    }).catch(err => {
        message.channel.send("Error getting data. Please try command again later.")
        console.log(err);
    });
}

// Used to play the given YouTube link in the message sender's voice channel
function playLink(message, link){
    var voiceChannel = message.member.voice.channel
    if (!voiceChannel){
        message.reply("You need to be in a voice channel to use this command.")
    } else {
        var permissions = voiceChannel.permissionsFor(message.client.user)
        if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
            message.reply("I need the join and speak permissions to use this command.")
        } else {
            voiceChannel.join().then(connection => {
                connection.play(ytdl(link, {format: "audioonly"})).on("finish", () => {voiceChannel.leave()})
            }).catch(error => {console.log(error)})
        }
    } 
}

// Used to play songs and control flow of the music queue
function playingQueue(message, link){
    var voiceChannel = message.member.voice.channel
    if (!voiceChannel){
        message.reply("You need to be in a voice channel to use this command.")
    } else {
        var permissions = voiceChannel.permissionsFor(message.client.user)
        if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
            message.reply("I need the join and speak permissions to use this command.")
        } else {
            voiceChannel.join().then(connection => {
                // Sending message to the channel where request occured of what is about to be played
                // Being grabbed by ytdl-core
                ytdl.getBasicInfo(link).then(r => {
                    message.channel.send(`Now Playing: ${r.videoDetails.title} ${r.videoDetails.video_url}`)
                })

                // Song begins to play, but after the song ends the next song will be played
                connection.play(ytdl(link, {format: "audioonly"})).on("finish", () => {
                    if (queue.size == 1){                   // if song last on queue, the bot leaves channel, all trackers are reset, and queue is emptied
                        queue.delete(currentSongTracker)
                        currentSongTracker = 0
                        queueTracker = 0
                        voiceChannel.leave()
                    } else if (queue.size >= 2){            // if song isnt last on queue, the bot will look for the next available song on the queue and play it
                        queue.delete(currentSongTracker)
                        for (var i = currentSongTracker; i < queueTracker + 1; i++){
                            if(queue.has(i)){
                                playingQueue(message, queue.get(i).get("link"))
                                currentSongTracker = i
                                break
                            }
                        }
                    }
                })
            }).catch(error => {console.log(error)})
        }
    } 
}

// Determines whether or not the user given is on Spotify or not. If
// the user is on Spotify it returns the song ID of the current song.
// Returns a 0 if nothing is found (not on Spotify).
function isUserOnSpotify(user){
    var songID   
    for (var i = 0; i < user.presence.activities.length; i++){
        if(user.presence.activities[i].name === "Spotify"){
            songID = user.presence.activities[i].syncID
            break
        } else {
            songID = 0
        }
    }
    return songID
}

module.exports = (client, message) => {
    // Holds the server elements
    var server = client.guilds.fetch(process.env.SERVER_ID)

    // Bot ID
    var botID = client.user.id

    // PUBLIC commands
    // (things in between "<>"s are parameters for that command)
    if (message.content.startsWith(prefix)){
        var whole = message.content.slice(prefix.length).trim().split(" ")
        var command = whole[0].toLowerCase()
        var user = message.author
        
        // pic
        if (command == "pic"){
            var index = Math.floor(Math.random() * jimmyPics.length)
            message.channel.send("Yoo look it's Jimmy! :sunglasses: :point_right: :point_right:", jimmyPics[index])
        }
        // share
        else if (command == "share" && isUserOnSpotify(user) !== 0){
            var url = `https://open.spotify.com/track/${isUserOnSpotify(user)}`
            var sendTo
            server.then(msg => {
                var channel = msg.channels.cache.find(channel => channel.name === 'music')
                if (channel == undefined){
                    message.reply("this server must have a \"music\" channel for this command to work. Please DM me to contact an admin.")
                }else{
                    sendTo = channel.fetch()
                    url.toString()

                    var userID = message.author.id

                    if (userID !== botID){
                        sendTo.then( message => {
                            var temp = "<@" + userID + "> shared this song from Spotify: " + url
                            message.send(temp).catch(error => {console.log(error)})
                        })
                    }
                }
            })
        }
        // info
        else if (command == "who"){
            message.channel.send("https://scarygodmother.fandom.com/wiki/Jimmy")
        }
        // movie
        else if (command == "movie"){
            message.channel.send("https://www.youtube.com/watch?v=Db9eo6NBdi8")
        }
        // play <search terms or link>
        else if (command == "play"){
            if (whole == "play"){
                message.reply("you are missing a YouTube link or search term.")
            } else {
                // if the song being requested is in the form of a YouTube link
                if (whole[1].startsWith("https://") || whole[1].startsWith("http://")){
                    if(queue.size == 0){
                        var temp = new Map()                            // temp map variable for the title and link
                        temp.set("link", whole[1])
                        ytdl.getBasicInfo(whole[1]).then(r => {         // using ytdl-core to grab title of video
                             temp.set("title", r.videoDetails.title)
                        })
                        queue.set(1, temp)                              // being added to queue
                        currentSongTracker = 1
                        queueTracker++
                        message.reply(`your request is currently #1 on the queue.`)
                        playingQueue(message, whole[1])
                    } else if (queue.size >= 1) {
                        queueTracker++
                        var temp = new Map()
                        temp.set("link", whole[1])
                        ytdl.getBasicInfo(whole[1]).then(r => {
                             temp.set("title", r.videoDetails.title)
                        })
                        queue.set(queueTracker, temp)
                        message.reply(`your request is currently #${queue.size} on the music queue.`)
                    }
                // if the song being requested needs to be searched
                } else {
                    var searchingFor = ""                               // combining all search terms into one term
                    for (var i = 1; i < whole.length; i++){
                        searchingFor += searchingFor + " " + whole[i]
                    }
                    yts(searchingFor).then(result => {                  // using yt-search to use term to search YouTube for the wanted song
                        var r = result.videos.slice(0, 1)               // and then slices results to get the top result, and that link is
                        r.forEach( function(x){                         // what is used to play song
                            if(queue.size == 0){
                                var temp = new Map()
                                temp.set("link", x.url)
                                temp.set("title", x.title)
                                queue.set(1, temp)
                                currentSongTracker = 1
                                queueTracker++
                                message.reply(`your request is currently #1 on the queue.`)
                                playingQueue(message, x.url)
                            } else if (queue.size >= 1) {
                                queueTracker++
                                var temp = new Map()
                                temp.set("link", x.url)
                                temp.set("title", x.title)
                                queue.set(queueTracker, temp)
                                message.reply(`your request is currently #${queue.size} on the music queue.`)
                            }
                        })
                    })
                }
            }
        }
        // skip
        else if (command == "skip"){
            if (queue.size == 0){
                message.reply("you can only use this skip where there are songs in the music queue.")
            } else {
                message.channel.send("Skipping song.")
                // if there is no more songs left in the queue
                if (queue.size == 1){
                    queue.delete(currentSongTracker)        // removes current song from queue, resets all trackers, and leaves voice channel
                    currentSongTracker = 0
                    queueTracker = 0
                    message.member.voice.channel.leave()
                // there are still songs in the queue
                } else if (queue.size >= 2){
                    queue.delete(currentSongTracker)        // removes current song from queue
                    for (var i = currentSongTracker; i < queueTracker + 1; i++){
                        if(queue.has(i)){
                            currentSongTracker = i          // finds next available song on the queue, updates tracker, and plays song
                            playingQueue(message, queue.get(i).get("link"))     
                            break
                        }
                    }
                }
            }
        }
        // queue
        else if (command == "queue"){
            if (queue.size == 0){
                message.reply("the queue is currently empty. Use $play to add to it!")
            } else if (queue.size >= 1){
                var text = "```"
                var temp = 1
                queue.forEach(function(x){
                    if (temp == 1){
                        text = text + `${temp} | ${x.get("title")} | Currently Playing\n`
                    } else {
                        text = text + `${temp} | ${x.get("title")}\n`
                        
                    }
                    temp++
                })
                text = text + "```"
                message.channel.send(text)
            }
        }
        // prayer
        else if (command == "prayer"){
            var t = new MessageAttachment('img/bible.jpg')
            message.reply("you have been blessed my child.", t);
        }
        // ERROR FOR share
        else if (command == "share" && isUserOnSpotify(user) === 0){
            message.reply("to use this command your Spotify must be connected to your Discord and the \"Display Spotify as your status\" setting must be turned on. You can enable this in Settings -> Connections")
        }
        // deals
        else if (command == "deals"){
            getGameSales(message);
        }  
        // help
        else if (command == "help"){
            var text = "```For any admin help, please send a DM to Jimmy.\n" +
            "-------------------------\n" +
            "GENERAL COMMANDS\n\n" +
            "$movie\n" +
            "$who >> Who's Jimmy?\n" +
            "$pic\n" +
            "$prayer\n" +
            "$share >> Shares the current song you are listening to on Spotify.\n" +
            "$deals >> See what games on Steam are on sale today.\n" +
            "-------------------------\n" +
            "MUSIC BOT COMMANDS\n\n" +
            "$play >> Plays a YouTube link in a voice channel or can search for a video to play from YouTube.\n" +
            "$skip >> Skips the current playing song.\n" +
            "$queue >> Shows what is currently in the queue.\n" +
            "-------------------------```"
            
            message.channel.send(text);

            // Raw Text
            /*
            For any admin help, please send a DM to Jimmy.
            -------------------------
            GENERAL COMMANDS

            $movie
            $who >> Who's Jimmy?
            $pic
            $prayer
            $share >> Shares the current song you are listening to on Spotify.
            $deals >> See what games on Steam are on sale today.
            -------------------------
            MUSIC BOT COMMANDS

            $play >> Plays a YouTube link in a voice channel or can search for a video to play from YouTube.
            $skip >> Skips the current playing song.
            $queue >> Shows what is currently in the queue.
            -------------------------
            */
        }
        // ADMIN commands
        // (things in between "<>"s are parameters for that command)
        else if (adminCommands.includes(command)){
            server.then(msg => {
                var channel = msg.channels.cache.find(channel => channel.name === 'admin')
                if (channel == undefined){
                    message.reply("this server must have an \"admin\" channel for this command to work.")
                }else{
                    var admin = channel.fetch()
                    admin.then(mess => {
                        // message <user> <message content>
                        if (command == "message" && message.channel.id === mess.id ){
                            if (whole[1] == null){
                                message.reply("You need to @ a user to use this command")
                            }
                            else if (whole[2] == null){
                                message.reply("You need to include a message while using this command")
                            } else {
                                var user = whole[1]
                                user = user.slice(1)
                                user = user.slice(1)
                                user = user.slice(1)
                                user = user.slice(0, user.length - 1)
                                var sendTo = client.users.cache.get(user)
                                var msg = whole[2]
                                if (whole.length >= 4){
                                    for (var i = 3; i < whole.length; i++){
                                        msg += " " + whole[i]
                                    }
                                }
                                sendTo.send(msg).catch(error => {console.log(error)})
                            }
                        }
                        // clear
                        else if (command == "clear" && message.channel.id === mess.id){
                            message.member.voice.channel.leave()
                            queue.clear()
                            server.then(msg =>{
                                var general = msg.channels.cache.find(channel => channel.name === 'general')
                                general.send("An admin has cleared the music queue.")
                            })
                        }
                        // status <new status>
                        else if (command == "status" && message.channel.id === mess.id){
                            if (whole[1] == null){
                                message.reply("You must include a new status if you would like to use this command.")
                            } else {
                                var text = ""
                                for (var i = 1; i < whole.length; i++){
                                    if (i == whole.length - 1){
                                        text += whole[i]
                                    } else {
                                        text += whole[i] + " "
                                    } 
                                }
                                client.user.setPresence({activity: {name: text}}).catch(console.error)
                            }
                        }
                        // controls
                        else if (command == "controls" && message.channel.id === mess.id){
                            var text = "```ADMIN COMMANDS\n" +
                            "(Please note that \"$controls\" is for admin controls, while \"$help\" is for public commands)\n" +
                            "-------------------------\n" +
                            "$message <@user> <message content> >> Messages the given user with Jimmy.\n\n" +
                            "$status <new status> >> Changes the status of Jimmy (will start with \"Playing\").\n\n" +
                            "$clear >> Clears the music queue, and Jimmy leaves the voice channel he is in.\n" +
                            "-------------------------```"

                            mess.send(text).catch(error => {console.log(error)})

                            // Raw Text
                            /*
                            ADMIN COMMANDS
                            (Please note that "$controls" is for admin help, while "$help" is for public commands)
                            -------------------------
                            $message <@user> <message content> >> Messages the given user with Jimmy.
                            $status <new status> >> Changes the status of Jimmy (will start with "Playing").
                            $clear >> Clears the music queue, and Jimmy leaves the voice channel he is in.
                            -------------------------
                            */
                        }
                    })
                }
            })
        }
        else {
            message.reply("I don't recognize this command. Try another one.")
        }
    }

    // When a user directly messages the bot, the message will be sent to the admin channel
    if(message.channel.type === "dm"){
        var dm = message.content.toString()
        var user = message.author.id

        server.then(msg => {
            var channel = msg.channels.cache.find(channel => channel.name === 'admin')
            if (channel == undefined){
                var sending = client.users.cache.find(usr => usr.id === user)
                sending.send("Jimmy is not able to be used for admin support at this time.").catch(error => {console.log(error)})
            } else {
                if (user != botID){
                    var temp = "<@" + user + "> sent a message to Jimmy: " + dm
                    channel.send(temp).catch(error => {console.log(error)})
                }
            }
        })
    }
}