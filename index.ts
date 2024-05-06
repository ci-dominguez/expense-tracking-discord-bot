import { Client, GatewayIntentBits } from 'discord.js';
import { commandHandler } from './functions/commandHandler';

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

discord_client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;

  //Respond if msg is from guild
  if (msg.channel.type === 0) {
    //Function receives msgs and handles if valid commands
    await commandHandler(msg);
  }
});

//Logging in the bot
discord_client.login(process.env.DISCORD_TOKEN);
