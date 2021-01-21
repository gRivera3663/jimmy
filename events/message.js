// prefix for commands
const prefix = "$"

// Library requirements
const { MessageAttachment, Message } = require("discord.js")
const ytdl = require("ytdl-core")

// Steam Options for YTDL
const streamOptions = {
    format: "audioonly",
    quality: "highestaudio"
}

const jimmyPics = [
    new MessageAttachment('img/jimmy1.jpg'),
    new MessageAttachment('img/jimmy2.jpg'),
    new MessageAttachment('img/jimmy3.jpg'),
    new MessageAttachment('img/jimmy4.jpg'),
    new MessageAttachment('img/jimmy5.jpg'),
    new MessageAttachment('img/jimmy6.jpg')
]

const adminCommands = [
    "controls",
    "message"
]

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
                connection.play(ytdl(link, streamOptions)).on("finish", () => {voiceChannel.leave()})
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
        var command = whole[0]
        var user = message.author

        // warning
        if (command == "warning"){
            playLink(message, "https://www.youtube.com/watch?v=SEQc0A3jM9A")
        }
        // pic
        else if (command == "pic"){
            var index = Math.floor(Math.random() * jimmyPics.length)
            message.channel.send("Yoo what's good Jimmy :sunglasses: :point_right: :point_right:", jimmyPics[index])
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
        else if (command == "info"){
            message.channel.send("https://scarygodmother.fandom.com/wiki/Jimmy")
        }
        // movie
        else if (command == "movie"){
            message.channel.send("https://www.youtube.com/watch?v=Db9eo6NBdi8")
        }
        // ERROR FOR share
        else if (command == "share" && isUserOnSpotify(user) === 0){
            message.reply("to use this command your Spotify must be connected to your Discord and the \"Display Spotify as your status\" setting must be turned on. You can enable this in Settings -> Connections")
        }  
        // help
        else if (command == "help"){
            var text = "```Jimmy Bot Commands\n" +
            "***NOTE: FOR ANY ADMIN HELP PLEASE DM THE BOT***\n" +
            "-------------------------\n" +
            "VOICE CHANNEL SOUND COMMANDS\n\n" +
            "$warning\n" +
            "-------------------------\n" +
            "COMMANDS\n" +
            "(Anything in \"<>\"s are other things the command needs to work.)\n\n" +
            "$movie\n" +
            "$info\n" +
            "$pic\n" +
            "$share >> Shares the current song you are listening to on Spotify.\n" +
            "-------------------------```"

            var channel = message.channel
            channel.send(text)

            // Raw Text
            /*
            Jimmy Bot Commands
            ***NOTE: FOR ANY ADMIN HELP PLEASE DM THE BOT***
            -------------------------
            VOICE CHANNEL SOUND COMMANDS

            $warning
            -------------------------
            COMMANDS
            (Anything in "<>"s are other things the command needs to work.)

            $movie
            $info
            $pic
            $share >> Shares the current song you are listening to on Spotify.
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
                        // controls
                        else if (command == "controls" && message.channel.id === mess.id){
                            var text = "```Admin Jimmy Bot Commands\n" +
                            "(Please note that \"$controls\" is for admin controls, while \"$help\" is for public commands)\n" +
                            "-------------------------\n" +
                            "$message <@user> <message content> >> Messages the given user with the Jimmy Bot.\n" +
                            "-------------------------```"

                            mess.send(text).catch(error => {console.log(error)})

                            // Raw Text
                            /*
                            Admin Jimmy Bot Commands
                            (Please note that "$controls" is for admin help, while "$help" is for public commands)
                            -------------------------
                            $message <@user> <message content> >> Messages the given user with the Jimmy Bot.
                            -------------------------
                            */
                        }
                    })
                }
            })
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