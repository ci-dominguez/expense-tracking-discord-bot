import prisma from '../utils/db';
import type { Message } from 'discord.js';
import { getSplit } from './split';

export const createRecord = async (
  msg: Message,
  splitName: string,
  amount: number,
  note: string,
  recordType: string
) => {
  try {
    const split = await getSplit(msg, splitName, false);

    if (!split) {
      msg.channel.send(`❌ Split **${splitName}** does not exist`);
      return;
    }

    await prisma.$transaction([
      //Update split total
      prisma.split.update({
        where: {
          id: split.id,
        },
        data: {
          records: {
            create: {
              amount: amount,
              note: note,
              recordType: recordType,
            },
          },
          total: {
            [recordType === 'Income' ? 'increment' : 'decrement']: amount,
          },
        },
      }),

      //Update bucket total
      prisma.bucket.update({
        where: {
          id: split.bucket.id,
        },
        data: {
          total: {
            [recordType === 'Income' ? 'increment' : 'decrement']: amount,
          },
        },
      }),
    ]);

    //User feedback
    msg.channel.send(
      `✅ ${recordType === 'Income' ? 'Added' : 'Removed'} 💵 **$${amount}** ${
        recordType === 'Income' ? 'to' : 'from'
      } 💰 **${splitName}**`
    );
  } catch (error) {
    console.log('❌ Unable to creating record: ' + error);
    msg.channel.send(`❌ Error creating record`);
  }
};

export const transfer = async (
  msg: Message,
  amount: number,
  fromSplit: string,
  toSplit: string,
  note: string
) => {
  try {
    //Get from and to splits and their buckets
    const fromSplitData = await getSplit(msg, fromSplit, false);

    const toSplitData = await getSplit(msg, toSplit, false);

    //Check if splits exist
    if (!fromSplitData || !toSplitData) {
      msg.channel.send(
        `❌ Either **${fromSplit}** or **${toSplit}** doesn't exist`
      );
      return;
    }

    //Update totals in the splits and their buckets
    await prisma.$transaction([
      //Update fromSplit total and create a record of the transfer out
      prisma.split.update({
        where: {
          id: fromSplitData.id,
        },
        data: {
          total: {
            decrement: amount,
          },
          records: {
            create: {
              amount: amount,
              note: note,
              recordType: 'Transfer Out',
            },
          },
        },
      }),

      //Update toSplit total and crete a record of the transfer in
      prisma.split.update({
        where: {
          id: toSplitData.id,
        },
        data: {
          total: {
            increment: amount,
          },
          records: {
            create: {
              amount: amount,
              note: note,
              recordType: 'Transfer In',
            },
          },
        },
      }),

      //Update 'fromBucket' total
      prisma.bucket.update({
        where: {
          id: fromSplitData.bucketId,
        },
        data: {
          total: {
            decrement: amount,
          },
        },
      }),

      //Update 'toBucket' total
      prisma.bucket.update({
        where: {
          id: toSplitData.bucketId,
        },
        data: {
          total: {
            increment: amount,
          },
        },
      }),
    ]);

    //User feedback
    msg.channel.send(
      `✅ Transferred 💵 **$${amount}** from 💰 **${fromSplit}** to 💰 **${toSplit}**`
    );
  } catch (error) {
    console.log('❌ Unable to transfer funds: ' + error);
    msg.channel.send(`❌ Error transferring funds`);
  }
};
