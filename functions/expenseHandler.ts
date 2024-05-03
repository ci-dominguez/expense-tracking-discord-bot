import type { Message } from 'discord.js';
import prisma from '../utils/db';

interface TransactionData {
  amount: number;
  bucket: string;
  comment?: string;
}

interface BucketData {
  name: string;
}

export const expenseHandler = async (msg: Message<boolean>) => {
  const [command, ...args] = msg.content.split(' ');
  let transactionData = parseTransactionArgs(args);
  let bucketData = parseBucketArgs(args);

  switch (command) {
    case '!add':
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
        msg.channel.send(
          '💡 Create income record with **!add <amount> <category>** ***--<optional comment>***'
        );
      }
      break;
    case '!remove':
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
        msg.channel.send(
          '💡 Create expense record with **!remove <amount> <category>** ***--<optional comment>***'
        );
      }
      break;
    case '!help':
      listCommands(msg);
      break;
    case '!create':
      if (bucketData && bucketData.name) createBucket(msg, bucketData.name);
      break;
    case '!delete':
      if (bucketData && bucketData.name) deleteBucket(msg, bucketData.name);
      break;
    case '!get':
      if (bucketData && bucketData.name) getBucket(msg, bucketData.name);
      break;
    default:
      msg.channel.send('😕 Unknown command **!help** for a list');
  }
};

const parseTransactionArgs = (args: string[]): TransactionData | undefined => {
  if (args.length === 0) return undefined;

  const amount = parseInt(args[0]);
  if (isNaN(amount)) return undefined;

  const commentIndex = args.findIndex((arg) => arg.startsWith('--'));
  let bucket: string, comment: string;

  if (commentIndex !== -1) {
    bucket = args.slice(1, commentIndex).join(' ');
    comment = args.slice(commentIndex).join(' ').replace('--', '');
  } else {
    bucket = args.slice(1).join(' ');
    comment = 'No comment';
  }
  return { amount, bucket, comment };
};

const createIncome = async (
  msg: Message<boolean>,
  amount: number,
  bucket: string,
  comment?: string
) => {
  msg.channel.send(
    `Adding **$${amount}** to **${bucket}** for ***${comment}***`
  );
};

const createExpense = async (
  msg: Message<boolean>,
  amount: number,
  bucket: string,
  comment?: string
) => {
  msg.channel.send(
    `Removing **$${amount}** from **${bucket}** for ***${comment}***`
  );
};

const listCommands = async (msg: Message<boolean>) => {
  msg.channel.send('📖 All available commands are **!add**, **!remove**');
};

const parseBucketArgs = (args: string[]): BucketData | undefined => {
  if (args.length === 0) return undefined;

  const commandIndex = args.findIndex((arg) => arg.startsWith('!'));
  const name = args.slice(commandIndex + 1).join(' ');
  return { name };
};

const createBucket = async (msg: Message<boolean>, bucketName: string) => {
  try {
    await prisma.bucket.create({
      data: {
        name: bucketName,
      },
    });
    msg.channel.send(`Created **${bucketName}**!`);
  } catch (error) {
    msg.channel.send('Unable to create new category.');
  }
};

const deleteBucket = async (msg: Message<boolean>, bucketName: string) => {
  try {
    await prisma.bucket.delete({ where: { name: bucketName } });
    msg.channel.send(`**${bucketName}** was deleted`);
  } catch (error) {
    msg.channel.send(`Unable to delete **${bucketName}**`);
  }
};

const getBucket = async (msg: Message<boolean>, bucketName: string) => {
  try {
    const bucket = await prisma.bucket.findUnique({
      where: {
        name: bucketName,
      },
      include: {
        transactions: true,
      },
    });

    if (!bucket) {
      msg.channel.send(`Category **${bucketName}** does not exist`);
      return;
    }

    const transactions = bucket.transactions;

    if (transactions.length === 0) {
      msg.channel.send(`**${bucketName}** has no transactions`);
      return;
    }

    const transactionList = transactions.map(
      (tr) => `$${tr.amount} for ${tr.comment}`
    );

    msg.channel.send(`**${bucketName}**:\n${transactionList.join('\n')}`);
  } catch (error) {
    msg.channel.send(`Unable to retrieve **${bucketName}**`);
  }
};
