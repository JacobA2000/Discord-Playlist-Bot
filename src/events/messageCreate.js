const { Events } = require('discord.js');
const { clientId } = require('../config.json');
const musicService = require("../musicService")

//const urlRegex = /\b((http|https):\/\/)?(www\.)?(open\.spotify\.com\/track\/[a-zA-Z0-9]+(\?[a-zA-Z0-9=&]*)?|music\.youtube\.com\/watch\?v=[a-zA-Z0-9_-]+(\&[a-zA-Z0-9=&]*)?|tidal\.com\/browse\/track\/[a-zA-Z0-9]+(\?[a-zA-Z0-9=&]*)?)\b/g;
const urlRegex = /\b((http|https):\/\/)?(www\.)?(open\.spotify\.com\/track\/[a-zA-Z0-9]+(\?[a-zA-Z0-9=&]*)?|music\.youtube\.com\/watch\?v=[a-zA-Z0-9_-]+(\&[a-zA-Z0-9=&]*)?)\b/g;

module.exports = {
	name: Events.MessageCreate,
	async execute(message) {

        // Do nothing if the message is from the bot itself.
        if (message.author == clientId) { return; };
        
        // Verify music channel.
        let { musicChannelId } = require('../config.json');
        if (message.channel.id != musicChannelId && musicChannelId != "") { return; };

        // Match spotify, yt music and tidal urls with a regex.
        let urlsMatched = message.content.match(urlRegex);
        if (urlsMatched == null) { return; };

        console.log(`Found potential music urls: ${urlsMatched}`);
        
        //ADD SONGS TO PLAYLIST
        urlsMatched.forEach(url => {
                if(url.includes("spotify")) {
                        const urlParts = url.split('/');
                        track_uri = `spotify:track:${urlParts[urlParts.length - 1]}`;
                        musicService.addTrackToSpotifyPlaylist(track_uri);

                        //IMPLEMENT HANDLING FOR YT PLAYLIST
                } 
                else if (url.includes("music.youtube")) {
                        const urlParts = url.split('?');
                        let video_id = "";
                        if (urlParts.length > 1) { 
                                const queryParams = urlParts[1].split('&'); 
                                for (let param of queryParams) { 
                                        const [key, value] = param.split('='); 
                                        if (key === 'v') { 
                                                video_id = value; 
                                        } 
                                } 
                        }
                        musicService.addVideoToYTPlaylist(video_id);
                        //IMPLEMENT HANDLING FOR SPOTIFY PLAYLIST
                }
        });
        
        await message.channel.send("Test");
	},
};