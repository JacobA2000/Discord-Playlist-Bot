const { SlashCommandBuilder } = require('discord.js');
const { spotifyPlaylistId, ytPlaylistId } = require('../../config.json')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('playlists')
		.setDescription('Returns the links to the playlists.'),
    async execute(interaction) {
        const spotifyPlaylistURL = `https://open.spotify.com/playlist/${spotifyPlaylistId}`;
        const ytPlaylistURL = `https://music.youtube.com/playlist?list=${ytPlaylistId}`;

		await interaction.reply(`Youtube Music Playlist: ${ytPlaylistURL}\nSpotify Playlist: ${spotifyPlaylistURL}`);
	},
};