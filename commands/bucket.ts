import prisma from '../utils/db';
import type { Message } from 'discord.js';

/**
 * Creates a new bucket
 *
 * @param msg - The message object for communication
 * @param bucketName - The name of the new bucket
 */
export const createBucket = async (msg: Message, bucketName: string) => {
  //Create the bucket
  try {
    await prisma.bucket.create({
      data: {
        name: bucketName,
      },
    });
    msg.channel.send(`✅ Created 🪣 **${bucketName}**!`);
  } catch (error) {
    console.log('❌ Unable to create bucket: ' + error);
    msg.channel.send('❌ Unable to create a new bucket');
  }
};

/**
 * Deletes a bucket and all associated records and splits
 *
 * @param msg - The message object for communication
 * @param bucketName - The name of the bucket to delete
 */
export const deleteBucket = async (msg: Message, bucketName: string) => {
  try {
    //Get bucket data including splits and records
    const bucket = await getBucket(msg, bucketName, false);

    //Check if bucket exists
    if (!bucket) {
      msg.channel.send(`**${bucketName}** does not exist`);
      return;
    }

    //Delete all records in the bucket's splits
    for (const split of bucket.splits) {
      await prisma.record.deleteMany({
        where: {
          splitId: split.id,
        },
      });
    }

    //Delete all splits in the bucket
    await prisma.split.deleteMany({
      where: {
        bucketId: bucket.id,
      },
    });

    //Delete the bucket itself
    await prisma.bucket.delete({ where: { id: bucket.id } });

    msg.channel.send(`🚮 **${bucket.name}** has been deleted`);
  } catch (error) {
    console.log('❌ Unable to delete bucket: ' + error);
    msg.channel.send(`❌ Unable to delete **${bucketName}**`);
  }
};

/**
 * Renames a bucket
 *
 * @param msg - The message object for communication
 * @param splitName - The current name of the bucket
 * @param newSplitName - The new name for the bucket
 */
export const renameBucket = async (
  msg: Message,
  bucketName: string,
  newBucketName: string
) => {
  try {
    //Attempt to retrieve bucket
    const existingBucket = await getBucket(msg, bucketName, false);

    //If the bucket doesn't exist then exit
    if (!existingBucket) {
      msg.channel.send(`❌ Bucket **${bucketName}** does not exist`);
      return;
    }

    //Update bucket.name
    await prisma.bucket.update({
      where: {
        id: existingBucket.id,
      },
      data: { name: newBucketName },
    });

    msg.channel.send(
      `🔄️ **${bucketName}** has been renamed to **${newBucketName}**`
    );
  } catch (error) {
    console.log('❌ Unable to rename bucket: ' + error);
    msg.channel.send(
      `❌ Unable to rename **${bucketName}** to **${newBucketName}**`
    );
  }
};

/**
 * Retrieves bucket information and optionally sends a message
 *
 * @param msg - The message object for communication
 * @param bucketName - The name of the bucket to retrieve
 * @param sendMsg - Boolean indicating whether to send a message or not
 * @returns Bucket
 */
export const getBucket = async (
  msg: Message,
  bucketName: string,
  sendMsg: boolean
) => {
  try {
    //Retrieve bucket and it's splits
    const bucket = await prisma.bucket.findFirst({
      where: {
        name: {
          equals: bucketName,
          mode: 'insensitive',
        },
      },
      include: {
        splits: true,
      },
    });

    //Check if bucket exists
    if (!bucket) {
      msg.channel.send(`**${bucketName}** does not exist`);
      return;
    }

    //Maps an array of splits in a bucket
    const splits = bucket.splits.map((split) => {
      `💰 **${split.name}:** ***$${split.total} / $${split.goal}***`;
    });

    //If user feedback is needed, check if bucket has any splits or not
    if (sendMsg) {
      msg.channel.send(
        `🪣 **${bucket.name}\n** 📊 ***$${bucket.total} / $${
          bucket.goal
        }***\n\n${splits.length === 0 ? '🫤 No splits yet' : splits.join('\n-')}`
      );
    }

    return bucket;
  } catch (error) {
    console.log('Unable to retrieve bucket: ' + error);
    msg.channel.send(`Unable to retrieve **${bucketName}**`);
  }
};
