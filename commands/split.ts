import prisma from '../utils/db';
import type { Message } from 'discord.js';
import { getBucket } from './bucket';

/**
 * Creates a new split and updates the bucket goal
 *
 * @param msg - The message object for communication
 * @param splitName - The name of the new split
 * @param goal - The goal amount for the new split
 * @param bucketName - The name of the bucket to associate the split with
 */
export const createSplit = async (
  msg: Message,
  splitName: string,
  goal: number,
  bucketName: string
) => {
  const bucket = await getBucket(msg, bucketName, false);

  if (!bucket) {
    msg.channel.send(`❌ **${bucketName}** doesn't exist`);
    return;
  }

  //Update the bucket with the new split and increase bucket goal by the split goal
  try {
    await prisma.bucket.update({
      where: {
        id: bucket.id,
      },
      data: {
        splits: {
          create: [{ name: splitName, goal: goal }],
        },
        goal: {
          increment: goal,
        },
      },
    });

    //User feedback
    msg.channel.send(`✅ Created 💰 **${splitName}** in 🪣 **${bucketName}**`);
  } catch (error) {
    console.log('❌ Unable to create a new split: ' + error);
    msg.channel.send('❌ Unable to create a new split');
  }
};

/**
 * Deletes a split and its records, and updates bucket goal
 *
 * @param msg - The message object for communication
 * @param splitName - The name of the split to delete
 */
export const deleteSplit = async (msg: Message, splitName: string) => {
  try {
    //Get split data
    const split = await getSplit(msg, splitName, false);

    //Check if split exists
    if (!split) {
      msg.channel.send(`❌ **${splitName}** does not exist`);
      return;
    }

    //Update bucket and delete records in the split
    await prisma.$transaction([
      //Update the bucket
      prisma.bucket.update({
        where: {
          id: split.bucketId,
        },
        data: {
          total: {
            decrement: split.total,
          },
          goal: {
            decrement: split.goal,
          },
        },
      }),

      //Delete all records in the split
      prisma.record.deleteMany({
        where: {
          splitId: split.id,
        },
      }),
    ]);

    //Delete the split itself
    await prisma.split.delete({ where: { id: split.id } });

    msg.channel.send(`🚮 **${splitName}** has been deleted`);
  } catch (error) {
    console.log('❌ Unable to delete split: ' + error);
    msg.channel.send(`❌ Unable to delete **${splitName}**`);
  }
};

/**
 * Renames a split
 *
 * @param msg - The message object for communication
 * @param splitName - The current name of the split
 * @param newSplitName - The new name for the split
 */
export const renameSplit = async (
  msg: Message,
  splitName: string,
  newSplitName: string
) => {
  try {
    //Attempt to retrieve split
    const existingSplit = await getSplit(msg, splitName, false);

    //If the split doesn't exist then exit
    if (!existingSplit) {
      msg.channel.send(`❌ Split **${splitName}** does not exist`);
      return;
    }

    //Update split.name
    await prisma.split.update({
      where: {
        id: existingSplit.id,
      },
      data: { name: newSplitName },
    });

    msg.channel.send(
      `🔄️ **${splitName}** has been renamed to **${newSplitName}**`
    );
  } catch (error) {
    console.log('❌ Unable to rename split: ' + error);
    msg.channel.send(
      `❌ Unable to rename **${splitName}** to **${newSplitName}**`
    );
  }
};

/**
 * Updates the split goal and bucket goal
 *
 * @param msg - The message object for communication
 * @param splitName - The name of the split
 * @param splitGoal - The new goal amount for the split
 */
export const editSplitGoal = async (
  msg: Message,
  splitName: string,
  splitGoal: number
) => {
  try {
    //Get split data and bucketID
    const split = await getSplit(msg, splitName, false);

    //Check if split exists
    if (!split) {
      msg.channel.send(`❌ Split **${splitName}** not found`);
      return;
    }

    //Update split.goal and bucket goal
    await prisma.$transaction([
      //updating split.goal
      prisma.split.update({
        where: {
          id: split.id,
        },
        data: { goal: splitGoal },
      }),
      //updating bucket.goal with the difference between the old and new split.goal
      prisma.bucket.update({
        where: {
          id: split.bucketId,
        },
        data: {
          goal: {
            increment: splitGoal - split.goal,
          },
        },
      }),
    ]);

    //User feedback
    msg.channel.send(
      `🎯 Goal for **${splitName}** has been adjusted to $${splitGoal}`
    );
  } catch (error) {
    console.log(`❌ Unable to update goal for **${splitName}**`);
    msg.channel.send(`❌ Unable to update goal for **${splitName}**`);
  }
};

/**
 * Retrieves information about a split and optionally sends a message
 *
 * @param msg - The message object for communication
 * @param splitName - The name of the split
 * @param sendMsg - Whether to send the retrieved information as a message
 * @returns Split
 */
export const getSplit = async (
  msg: Message,
  splitName: string,
  sendMsg: boolean
) => {
  try {
    //Retrieve split
    const split = await prisma.split.findFirst({
      where: {
        name: {
          equals: splitName,
          mode: 'insensitive',
        },
      },
      include: {
        records: true,
        bucket: true,
      },
    });

    //If split doesn't exist then exit
    if (!split) {
      msg.channel.send(`**${splitName}** doest not exist`);
      return;
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

    //If user feedback is needed, send msg with all records in the spit
    if (sendMsg) {
      msg.channel.send(
        `💰 **${split.name}:** ***$${split.total} / $${split.goal}***\n${
          records.length === 0 ? '🫤 No records yet' : records.join('\n')
        }`
      );
    }

    return split;
  } catch (error) {
    console.log('❌ Unable to retrieve split: ' + error);
    msg.channel.send(`❌ Unable to retrieve **${splitName}**`);
  }
};
