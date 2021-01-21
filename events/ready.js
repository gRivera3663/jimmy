const Discord = require("discord.js")

module.exports = client => {
    // Log in message means that bot is ready to use
    console.log(`Logged in as ${client.user.tag}`)

    // Adds custom status
    client.user.setPresence({activity: {name: "Ion TV"}}).catch(console.error)
}