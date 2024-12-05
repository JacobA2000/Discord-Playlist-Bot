const fs = require('node:fs');
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const configJSON = require('../../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setmusicchannel')
		.setDescription('Allows tracks sent in only one channel to be added to the playlist.')
        .addChannelOption(option =>
            option.setName("channel")
                .setDescription("The channel you wish to track.")
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const channel = interaction.options.getChannel("channel")
        
        configJSON.musicChannelId = channel.id;
        fs.writeFileSync('src/config.json', JSON.stringify(configJSON, null, 2));

        console.log(`Set music channel as ${channel.name} with id ${channel.id}.`)
		await interaction.reply(`Set music channel as <#${channel.id}>`);
	},
};