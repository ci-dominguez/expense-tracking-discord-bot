import prisma from '../utils/db';
import type { Message } from 'discord.js';

export const generalCmdManager = async (
  msg: Message,
  cmd: string,
  args: string[]
) => {};

/**
 * Sends a list of available commands
 *
 * @param msg - The message object for communication
 */
const listCommands = async (msg: Message) => {
  msg.channel.send(
    'All available commands are **!add**, **!remove**, **!create**, **!delete**, **!get**'
  );
};
