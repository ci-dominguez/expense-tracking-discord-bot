import { Client, Events, GatewayIntentBits } from 'discord.js';

//Creating new Client instance with 3 intents
const discord_client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

//Adding listeners to the client
discord_client.on('ready', () => {
  console.log(discord_client.user?.tag);
  console.log(process.env);
});

//Respond with Hello if msg is hi!
discord_client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;

  //Respond if msg is from guild
  if (msg.channel.type === 0) {
    if (msg.content === 'hi!') {
      msg.channel.send('Hello');
    }
  }
});

//Logging in the bot
discord_client.login(process.env.DISCORD_TOKEN);
