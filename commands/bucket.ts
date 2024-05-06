import prisma from '../utils/db';
import type { Message } from 'discord.js';
import type { BucketCmdContent } from '../common/types';

/**
 * Manages bucket commands by parsing the arguments and executing the
 * corresponding action.
 *
 * @param msg - The message object for communication
 * @param cmd - The main command string
 * @param args - The arguments passed with the command
 */
export const bucketCmdManager = async (
  msg: Message,
  cmd: string,
  args: string[]
) => {
  const bucketArgs = parseBucketArgs(cmd, args);

  //Check if valid bucket data is present before executing
  if (!bucketArgs) {
    msg.channel.send('No valid **bucket data** is present...');
  } else {
    switch (bucketArgs.subCmd) {
      case 'create':
        createBucket(msg, bucketArgs.bucketName);
        break;
      case 'delete':
      case 'del':
        deleteBucket(msg, bucketArgs.bucketName);
        break;
      case 'get':
        getBucket(msg, bucketArgs.bucketName, true);
        break;
      //Handles unknown commands
      default:
        msg.channel.send(
          '💬 Unknown **!bucket** command... try:\n- !bucket **create** <bucketName>\n- !bucket **delete** <bucketName>\n- !bucket **get** <bucketName>\n- !bucket **rename** <bucketName> ~<newBucketName>'
        );
    }
  }
};

/**
 * Parses bucket command args from message content
 *
 * @param args - The arguments to parse
 * @returns BucketCmdContent
 */
const parseBucketArgs = (cmd: string, args: string[]): BucketCmdContent => {
  const mainCmd = cmd;
  const subCmd = args[0];

  const bucketNameIdx = args.findIndex((arg) => arg.startsWith('!')) + 2;
  const bucketName = args.slice(bucketNameIdx).join(' ');

  return { mainCmd, subCmd, bucketName };
};

/**
 * Retrieves bucket information and optionally sends a message
 *
 * @param msg - The message object for communication
 * @param bucketName - The name of the bucket to retrieve
 * @param sendMsg - Boolean indicating whether to send a message or not
 * @returns Bucket ID
 */
const getBucket = async (
  msg: Message,
  bucketName: string,
  sendMsg: boolean
) => {
  try {
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

    if (!bucket) {
      msg.channel.send(`**${bucketName}** does not exist`);
      return undefined;
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

    return bucket.id;
  } catch (error) {
    console.log('Unable to retrieve bucket: ' + error);
    msg.channel.send(`Unable to retrieve **${bucketName}**`);
  }
};

/**
 * Creates a new bucket
 *
 * @param msg - The message object for communication
 * @param bucketName - The name of the new bucket
 */
const createBucket = async (msg: Message, bucketName: string) => {
  try {
    await prisma.bucket.create({
      data: {
        name: bucketName,
      },
    });
    msg.channel.send(`✅ Created **${bucketName}**!`);
  } catch (error) {
    console.log('Unable to create bucket: ' + error);
    msg.channel.send('❌ Unable to create new bucket');
  }
};

/**
 * Deletes a bucket and all associated records and splits
 *
 * @param msg - The message object for communication
 * @param bucketName - The name of the bucket to delete
 */
const deleteBucket = async (msg: Message, bucketName: string) => {
  try {
    const bucket = await prisma.bucket.findFirst({
      where: {
        name: {
          equals: bucketName,
          mode: 'insensitive',
        },
      },
      include: {
        splits: {
          include: {
            records: true,
          },
        },
      },
    });

    if (!bucket) {
      msg.channel.send(`**${bucketName}** does not exist`);
      return;
    }

    for (const split of bucket.splits) {
      await prisma.record.deleteMany({
        where: {
          splitId: split.id,
        },
      });
    }

    //Deletes all splits in the bucket
    await prisma.split.deleteMany({
      where: {
        bucketId: bucket.id,
      },
    });

    //Deletes the bucket
    await prisma.bucket.delete({ where: { id: bucket.id } });

    msg.channel.send(`✅ **${bucket.name}** has been permanently deleted`);
  } catch (error) {
    console.log('Unable to delete bucket: ' + error);
    msg.channel.send(`❌ Unable to delete **${bucketName}**`);
  }
};
