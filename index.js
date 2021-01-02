const { Client, MessageEmbed } = require('discord.js');

const intents =  [
    "DIRECT_MESSAGES", 
    "GUILDS", 
    "GUILD_MEMBERS", 
    "GUILD_MESSAGES"
];

const client = new Client({
    ws: {
        intents: intents
    }
});

require('dotenv')

client.login(process.env.TOKEN)
let prefix = process.env.PREFIX

client.on('ready', async () => {
    await client.user.setPresence({ 
        activity: {
            name: `DM\'s for `,
            type: 'WATCHING'
        },
        status: 'online',
    });

    console.log(`${client.user.tag} is ready to work.`);
});

client.on('channelDelete', async channel => {
    if(channel.parentID == channel.guild.channels.cache.find(c => c.name == 'MODMAIL').id){
        const member = channel.guild.members.cache.find(m => m.id == channel.name);
        if(!member) return;

        const delEmbed = new MessageEmbed()
            .setTitle('Your mail has been closed')
            .setColor('RED')
            .setTimestamp()
            .setThumbnail(client.user.displayAvatarURL())
            .setDescription('Your mail was deleted by the server staff and if you have any problem with it you can open the mail again.')
        return member.send(delEmbed)
    } else return;
});

client.on('message', async message => {
    if(message.author.bot || message.webhookID) return;


    let args = message.content.slice(prefix.length).split(' ');
    let cmd = args.shift().toLowerCase();

    if(cmd.length === 0) return;

    if(message.guild){
        if(cmd == 'setup'){
            if(!message.member.hasPermission('ADMINISTRATOR')) return message.reply('You need Adminstrator perms to setup the mod mail');
            
            let role = message.guild.roles.cache.find(r => r.name == "SUPPORTER");
            let everyone = message.guild.roles.cache.find(r => r.name == "@everyone");

            if(!role){
                role = await message.guild.roles.create({
                    data: {
                        name: "supporter",
                        color: "GREEN"
                    },
                    reason: 'supporter'
                });
            };

            await message.guild.channels.create('MODMAIL', {
                type: 'category',
                topic: 'All the mails to the mod mail will show here.',
                permissionOverwrites: [{
                        id: role.id,
                        allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "READ_MESSAGE_HISTORY"]
                    },
                    {
                        id: everyone.id,
                        deny: ["VIEW_CHANNEL", "SEND_MESSAGES", "READ_MESSAGE_HISTORY"]
                    }
                ],
            });

            return message.channel.send(new MessageEmbed()
                .setDescription('ModMail setup has been completed')
                .setTimestamp()
                .setColor("GREEN")    
            );
        };

        if(cmd == 'close'){
            if(message.channel.parentID == message.guild.channels.cache.find(c => c.name == 'MODMAIL').id){
                const mailMember = message.guild.members.cache.get(message.channel.name);

                if(!mailMember) return message.reply('The mail was not closed, it must because of channel name changing or not existing')
                
                await message.channel.delete()

                let delChxEmbed = new MessageEmbed()
                    .setTitle('You mail has been closed')
                    .setFooter('The mail was closed by' + message.author.tag)
                    .setColor('RED')
                    .setTimestamp()
                if(args[0]) delChxEmbed.setDescription(args.join(' '));

                return mailMember.send(delChxEmbed);
            };
        } 
        
        if(cmd == 'open'){
            const category = message.guild.channels.cache.find(c => c.name == 'MODMAIL');

            if(!category) return message.reply('Modmail is not setted up.\n Use the setup cmd.')

            if(!message.member.roles.cache.find(r => r.name == 'supporter') || !message.member.hasPermission("ADMINISTRATOR")) return message.reply('You are not a supporter you cant open a mail')
            
            if(isNaN(args[0]) || !args.length) return message.reply('Please give ID of the person');
            
            const target = message.guild.members.cache.find(m => m.id === args[0]);

            if(!target) return message.channel.send('I was not able to find the user with the given ID.');

            const createMemberMailChx = await message.guild.channels.create(target.id, {
                type: 'text',
                parent: category.id,
                topic: `This mail is directly opened by ${message.author.tag} to contact ${target.tag}`
            });

            let nembed = new MessageEmbed()
                .setAuthor("DETAILS", target.user.displayAvatarURL({
                    dynamic: true
                }))
                .setColor("BLUE")
                .setThumbnail(target.user.displayAvatarURL({
                    dynamic: true
                }))
                .addField("Name", target.user.username)
                .addField("Account Creation Date", target.user.createdAt)
                .addField("Direct Contact", "Yes(it means this mail is opened by a supporter)")
                .setFooter('Opened by' + message.author.tag)

            createMemberMailChx.send(nembed);

        } 
        
        if(cmd == "help") {
            let helpEmbed = new MessageEmbed()
                .setAuthor('MODMAIL BOT', client.user.displayAvatarURL())
                .setColor("GREEN")

                .setDescription("This bot is made by CTK WARRIOR, You can remove credits :D")
                .addField(prefix + "setup", "Setup the modmail system(This is not for multiple server.)", true)

                .addField(prefix + "open", 'Let you open the mail to contact anyone with his ID', true)
                .setThumbnail(client.user.displayAvatarURL())
                .addField(prefix + "close", "Close the mail in which you use this cmd.", true);

            return message.channel.send(helpEmbed)
        };
    }

    if (message.channel.parentID) {

        const category = message.guild.channels.cache.find((x) => x.name == "MODMAIL")
        if (message.channel.parentID == category.id) {
            let member = message.guild.members.cache.get(message.channel.name)
            if (!member) return message.channel.send('Unable To Send Message')
            let lembed = new MessageEmbed()
                .setColor("GREEN")
                .setFooter(message.author.username, message.author.displayAvatarURL({
                    dynamic: true
                }))
                .setTitle(message.content)

            return member.send(lembed)
        }
    }
    if (!message.guild) {
        const guild = await client.guilds.cache.get(process.env.SERVERID);
        if (!guild) return;

        const main = guild.channels.cache.find((x) => x.name == message.author.id)
        const category = guild.channels.cache.find((x) => x.name == "MODMAIL")

        if (!main) {
            let mx = await guild.channels.create(message.author.id, {
                type: "text",
                parent: category.id,
                topic: "This mail is created for helping  **" + message.author.tag + " **"
            })

            let sembed = new MessageEmbed()
                .setAuthor("MAIN OPENED")
                .setColor("GREEN")
                .setThumbnail(client.user.displayAvatarURL())
                .setDescription("Conversation is now started, you will be contacted by supporters soon :D")

            message.author.send(sembed)

            let eembed = new MessageEmbed()
                .setAuthor("DETAILS", message.author.displayAvatarURL({
                    dynamic: true
                }))
                .setColor("BLUE")
                .setThumbnail(message.author.displayAvatarURL({
                    dynamic: true
                }))
                .setDescription(message.content)
                .addField("Name", message.author.username)
                .addField("Account Creation Date", message.author.createdAt)
                .addField("Direct Contact", "No(it means this mail is opened by person not a supporter)")
            return mx.send(eembed)
        }

        let xembed = new MessageEmbed()
            .setColor("YELLOW")
            .setFooter(message.author.tag, message.author.displayAvatarURL({
                dynamic: true
            }))
            .setTitle(message.content)
        main.send(xembed)
    }
});