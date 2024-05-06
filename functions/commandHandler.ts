import type { Message } from 'discord.js';
import { bucketCmdManager } from '../commands/bucket';
import { recordCmdManager } from '../commands/record';
import { generalCmdManager } from '../commands/general';
import { splitCmdManager } from '../commands/split';

/**
 * Handles incoming messages and dispatches commands accordingly
 *
 * @param msg - The message object containing the command
 */
export async function commandHandler(msg: Message) {
  //Parse through the message content
  const [cmd, ...args] = msg.content.split(' ');

  switch (cmd) {
    case '!record':
      recordCmdManager(msg, cmd, args);
      break;
    case '!bucket':
      bucketCmdManager(msg, cmd, args);
      break;
    case '!split':
      splitCmdManager(msg, cmd, args);
      break;
    case '!help':
      generalCmdManager(msg, cmd, args);
      break;
    default:
      msg.channel.send('😕 Unknown command **!help*** for a list');
  }
}
