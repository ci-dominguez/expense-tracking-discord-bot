import type { Message } from 'discord.js';
import prisma from '../utils/db';
import type { TransactionData, BucketData } from '../common/types';

/**
 * Handles incoming messages and dispatches commands accordingly
 *
 * @param msg - The message object containing the command
 */
export const expenseHandler = async (msg: Message<boolean>) => {
  //Parsees through message content to turn into data
  const [command, ...args] = msg.content.split(' ');
  let transactionData = parseTransactionArgs(args);
  let bucketData = parseBucketArgs(args);

  switch (command) {
    case '!add':
      //Checks if valid data is present and creates an income record
      if (
        transactionData &&
        transactionData.bucket &&
        transactionData.amount &&
        !isNaN(transactionData.amount)
      ) {
        createIncome(
          msg,
          transactionData.amount,
          transactionData.bucket,
          transactionData.comment
        );
      } else {
        //Sends instructions for the command if data is invalid
        msg.channel.send(
          '💡 Create income record with **!add <amount> <category>** ***--<optional comment>***'
        );
      }
      break;
    case '!remove':
      //Checks if valid data is present and creates an expense record
      if (
        transactionData &&
        transactionData.bucket &&
        transactionData.amount &&
        !isNaN(transactionData.amount)
      ) {
        createExpense(
          msg,
          transactionData.amount,
          transactionData.bucket,
          transactionData.comment
        );
      } else {
        //Sends instructions for the command if data is invalid
        msg.channel.send(
          '💡 Create expense record with **!remove <amount> <category>** ***--<optional comment>***'
        );
      }
      break;
    case '!help':
      //Lists all available commands
      listCommands(msg);
      break;
    case '!create':
      //Checks if valid bucket data is present and creates a bucket
      if (bucketData && bucketData.name) createBucket(msg, bucketData.name);
      break;
    case '!delete':
      //Checks if valid bucket data is present and deletes a bucket
      if (bucketData && bucketData.name) deleteBucket(msg, bucketData.name);
      break;
    case '!get':
      //Checks if valid bucket data is present and retrieves bucket information
      if (bucketData && bucketData.name) getBucket(msg, bucketData.name, true);
      break;
    //Handles unknown commands
    default:
      msg.channel.send('😕 Unknown command **!help** for a list');
  }
};

/**
 * Parses transaction arguments from message content
 *
 * @param args - The arguments to parse
 * @returns TransactionData
 */
const parseTransactionArgs = (args: string[]): TransactionData => {
  const amount = parseInt(args[0]);

  //Finds index of the comment flagged with --
  const commentIndex = args.findIndex((arg) => arg.startsWith('--'));
  let bucket: string, comment: string;

  //Extracting bucket and comment from args
  if (commentIndex !== -1) {
    bucket = args.slice(1, commentIndex).join(' ');
    comment = args.slice(commentIndex).join(' ').replace('--', '');
  } else {
    bucket = args.slice(1).join(' ');
    comment = 'No comment';
  }

  return { amount, bucket, comment };
};

/**
 * Parses bucket arguments from message content
 *
 * @param args - The arguments to parse
 * @returns BucketData
 */
const parseBucketArgs = (args: string[]): BucketData => {
  const commandIndex = args.findIndex((arg) => arg.startsWith('!'));
  const name = args.slice(commandIndex + 1).join(' ');
  return { name };
};

/**
 * Creates a new income transaction and updates the bucket total
 *
 * @param msg - The message object for communication
 * @param amount - The amount of income
 * @param bucket - The bucket name
 * @param comment - Optional comment for the transaction
 */
const createIncome = async (
  msg: Message<boolean>,
  amount: number,
  bucket: string,
  comment?: string
) => {
  try {
    const bucketId = await getBucket(msg, bucket, false);

    const transactionData: any = {
      amount: amount,
      comment: comment,
      transactionType: 'Income',
    };

    //Using prisma to update the bucket with new transaction & total
    await prisma.bucket.update({
      where: {
        id: bucketId,
      },
      data: {
        transactions: {
          create: [transactionData],
        },
        total: {
          increment: amount,
        },
      },
    });

    msg.channel.send(
      `Adding **$${amount}** to **${bucket}** for ***${comment}***`
    );
  } catch (error) {
    console.log(error);
    msg.channel.send('Unable to create a new transaction');
  }
};

/**
 * Creates a new expense transaction and updates the bucket total
 *
 * @param msg - The message object for communication
 * @param amount - The amount of expense
 * @param bucket - The bucket name
 * @param comment - Optional comment for the transaction
 */
const createExpense = async (
  msg: Message<boolean>,
  amount: number,
  bucket: string,
  comment?: string
) => {
  try {
    const bucketId = await getBucket(msg, bucket, false);

    const transactionData: any = {
      amount: amount,
      comment: comment,
      transactionType: 'Expense',
    };

    //Using prisma to update the bucket with new transaction & total
    await prisma.bucket.update({
      where: {
        id: bucketId,
      },
      data: {
        transactions: {
          create: [transactionData],
        },
        total: {
          decrement: amount,
        },
      },
    });

    msg.channel.send(
      `Removing **$${amount}** from **${bucket}** for ***${comment}***`
    );
  } catch (error) {
    console.log(error);
    msg.channel.send('Unable to create a new transaction.');
  }
};

/**
 * Sends a list of available commands
 *
 * @param msg - The message object for communication
 */
const listCommands = async (msg: Message<boolean>) => {
  msg.channel.send(
    'All available commands are **!add**, **!remove**, **!create**, **!delete**, **!get**'
  );
};

/**
 * Creates a new bucket
 *
 * @param msg - The message object for communication
 * @param bucketName - The name of the new bucket
 */
const createBucket = async (msg: Message<boolean>, bucketName: string) => {
  try {
    await prisma.bucket.create({
      data: {
        name: bucketName,
      },
    });
    msg.channel.send(`Created **${bucketName}**!`);
  } catch (error) {
    msg.channel.send('Unable to create new a category.');
  }
};

/**
 * Deletes a bucket and all associated transactions
 *
 * @param msg - The message object for communication
 * @param bucketName - The name of the bucket to delete
 */
const deleteBucket = async (msg: Message<boolean>, bucketName: string) => {
  try {
    const bucketId = await getBucket(msg, bucketName, false);

    //Deletes all transactions in the bucket
    await prisma.transaction.deleteMany({
      where: {
        bucketId: bucketId,
      },
    });

    //Deletes the bucket
    await prisma.bucket.delete({ where: { name: bucketName } });
    msg.channel.send(
      `**${bucketName}** and all it's transactions have been permanently deleted.`
    );
  } catch (error) {
    console.log(error);
    msg.channel.send(`Unable to delete **${bucketName}**`);
  }
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
  msg: Message<boolean>,
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
        transactions: true,
      },
    });

    if (!bucket) {
      msg.channel.send(`Category **${bucketName}** does not exist`);
      return undefined;
    }

    const transactions = bucket.transactions;

    if (transactions.length === 0) {
      msg.channel.send(`**${bucketName}** has no transactions`);
      return bucket.id;
    }

    const transactionList = transactions.map(
      (tr) =>
        `${tr.transactionType === 'Expense' ? '-' : '+'} $${tr.amount} for ${
          tr.comment
        }`
    );

    if (sendMsg) {
      msg.channel.send(
        `**${bucketName}** - Total **$${bucket.total}**\n${transactionList.join(
          '\n'
        )}`
      );
    }

    return bucket.id;
  } catch (error) {
    msg.channel.send(`Unable to retrieve **${bucketName}**`);
  }
};
