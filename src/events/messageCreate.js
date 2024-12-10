const { Events } = require('discord.js');
const { clientId, clearThreshold } = require('../config.json');
const musicService = require("../musicService")
const songlink = require('../songlink')

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
                //urlsMatched.forEach(url => {
                for (url of urlsMatched) {
                        if(url.includes("spotify")) {
                                //CHECK PLAYLIST LENGTH IF ABOVE THRESHOLD CLEAR PLAYLISTS
                                spotifyLen = await musicService.getSpotifyPlaylistLength();
                                if (spotifyLen >= clearThreshold) {
                                        await musicService.clearSpotifyPlaylist();
                                        await musicService.clearYTPlaylist();
                                }

                                //HANDLING FOR ADDING TO SPOTIFY PLAYLIST
                                const urlParts = url.split('/');
                                track_id = urlParts[urlParts.length - 1];
                                // Handle case where track_id contains extra parameters 
                                if (track_id.includes('?')) { 
                                        track_id = track_id.split('?')[0];
                                }
                                track_uri = `spotify:track:${track_id}`;
                                await musicService.addTrackToSpotifyPlaylist(track_uri);

                                //GET TRACK ISRC FROM SPOTIFY
                                isrc = await musicService.getISRCFromSpotify(track_id);

                                //HANDLING FOR ADDING TO YT PLAYLIST
                                //ytId = await songlink.getTrackIds(url=url, platformToFind="yt")
                                ytId = await musicService.searchYTByISRC(isrc);
                                await musicService.addVideoToYTPlaylist(ytId);      
                        } 
                        else if (url.includes("music.youtube")) {
                                //CHECK PLAYLIST LENGTH IF ABOVE THRESHOLD CLEAR PLAYLISTS
                                spotifyLen = await musicService.getSpotifyPlaylistLength();
                                if (spotifyLen >= clearThreshold) {
                                        await musicService.clearSpotifyPlaylist();
                                        await musicService.clearYTPlaylist();
                                }

                                //HANDLING FOR ADDING TO YT PLAYLIST
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
                                await musicService.addVideoToYTPlaylist(video_id);

                                //HANDLING FOR ADDING TO SPOTIFY PLAYLIST
                                const spotifyId = await songlink.getTrackIds(url=url, platformToFind="spotify");
                                console.log(spotifyId);
                                const spotifyURI = `spotify:track:${spotifyId}`;
                                console.log(spotifyURI);

                                if (spotifyId == "Not found") {
                                        //GET INFORMATION FROM YT
                                        ytVideoInfo = await musicService.getYTVideoInfo(video_id);
                                        title = ytVideoInfo.snippet.title;
                                        channelTitle = ytVideoInfo.snippet.channelTitle;

                                        if (channelTitle.includes(" - Topic")){
                                                channelTitle = channelTitle.replace(" - Topic", "");
                                        }

                                        if (channelTitle.toLowerCase() == 'release') {
                                                channelTitle = "";
                                        }

                                        tags = ytVideoInfo.snippet.tags;

                                        //SEARCH SPOTIFY FOR TRACK
                                        spotifyURI = await musicService.searchSpotify(title, channelTitle);
                                }
                                
                                await musicService.addTrackToSpotifyPlaylist(spotifyURI);
                        }
                };
                
                //await message.react("🫡");
                await message.react("1151324248263110726");
	},
};