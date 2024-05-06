import prisma from '../utils/db';
import type { Message } from 'discord.js';

export const splitCmdManager = async (
  msg: Message,
  cmd: string,
  args: string[]
) => {};

export const getSplit = async (
  msg: Message,
  splitName: string,
  sendMsg: boolean
) => {
  try {
    const split = await prisma.split.findFirst({
      where: {
        name: {
          equals: splitName,
          mode: 'insensitive',
        },
      },
      include: {
        records: true,
      },
    });

    if (!split) {
      msg.channel.send(`**${splitName}** doest not exist`);
      return undefined;
    }

    //Maps an array of records in a split
    const records = split.records.map((rec) => {
      `${
        rec.recordType === 'Expense'
          ? '🔴'
          : rec.recordType === 'Income'
          ? '🟢'
          : '🟣'
      } **$${rec.amount}** *${rec.note}*`;
    });

    //If user feedback is needed, check k if split has any records or not
    if (sendMsg) {
      msg.channel.send(
        `💰 **${split.name}:** ***$${split.total} / $${split.goal}***\n${
          records.length === 0 ? '🫤 No records yet' : records.join('\n')
        }`
      );
    }
  } catch (error) {
    console.log('Unable to retrieve split: ' + error);
    msg.channel.send(`Unable to retrieve **${splitName}**`);
  }
};
