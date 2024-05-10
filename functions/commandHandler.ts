import type { Message } from 'discord.js';
import {
  createBucket,
  deleteBucket,
  getBucket,
  renameBucket,
} from '../commands/bucket';
import {
  createSplit,
  deleteSplit,
  editSplitGoal,
  getSplit,
  renameSplit,
} from '../commands/split';
import type {
  BucketCmdContent,
  SplitCmdContent,
  RecordCmdContent,
} from '../common/types';
import { createRecord, transfer } from '../commands/record';

/**
 * Handles incoming messages and dispatches commands accordingly
 *
 * @param msg - The message object containing the command
 */
export async function commandHandler(msg: Message) {
  //Parse through the message content
  const [cmd, ...args] = msg.content.split(' ');

  switch (cmd.toLowerCase()) {
    case '!record':
    case '!rec':
    case '!r':
      recordCmdManager(msg, cmd, args);
      break;
    case '!bucket':
    case '!b':
      bucketCmdManager(msg, cmd, args);
      break;
    case '!split':
    case '!s':
      splitCmdManager(msg, cmd, args);
      break;
    case '!help':
      msg.channel.send(
        '💬 All available commands are:\n\n🪣 **BUCKET COMMANDS**\n\n🟢 **Create Bucket**\n- !bucket **create** <bucketName>\n\n🔴 **Delete Bucket**\n- !bucket **delete** <bucketName>\n\n🔭 **Show Bucket Details**\n- !bucket **get** <bucketName>\n\n🔠 **Rename Bucket**\n- !bucket **rename** <bucketName> ~<newBucketName>\n\n\n💰 **SPLIT COMMANDS**\n\n✅ **Create Split**\n- !split **create** <splitName> **$**<goal> **>**<bucketName>\n\n🚮 **Delete Split**\n- !split **delete** <splitName>\n\n🔭 **Show Split Details**\n- !split **get** <splitName>\n\n🔠 **Rename Split**\n- !split **rename** <splitName> **~**<newSplitName>\n\n🎯 **Change Split Goal**\n- !split **goal** <splitName> **$**<newGoalAmount>\n\n\n💵 **TRANSACTION RECORDS**\n\n🟢 **Create Income**\n- !record add **$**<amount> **>**<splitName> **--**<note>\n\n🔴 **Create Expense**\n- !record remove **$**<amount> **>**<splitName> **--**<note>\n\n🔀 **Transfer Between Splits**\n- !record transfer **$**<amount> **>**<splitName> **:**<newSplitName> **--**<note>'
      );
      break;
    default:
      msg.channel.send('💬 Unknown command... try **!help**');
  }
}

/**
 * Slices, trims, and combines args array in order to assign variables a string
 *
 * @param args The array of strings representing the arguments.
 * @param firstIdx The index to start slicing the arguments.
 * @param secondIdx Optional. The index to stop slicing the arguments.
 * @param thirdIdx Optional. The index to start slicing the concatenated result.
 * @returns The parsed and concatenated string.
 */
const formatVar = (
  args: string[],
  firstIdx: number,
  secondIdx?: number,
  thirdIdx?: number
) => {
  const slicedArgs = args.slice(firstIdx, secondIdx ? secondIdx : undefined);
  return thirdIdx
    ? slicedArgs.join(' ').slice(thirdIdx).trim().replace(/\s+/g, ' ')
    : slicedArgs.join(' ').trim().replace(/\s+/g, ' ');
};

/**
 * Parses bucket command arguments from message content
 *
 * @param cmd - The main command
 * @param args - The arguments array containing the split command
 * @returns BucketCmdContent
 */
const parseBucketCmdContent = (
  cmd: string,
  args: string[]
): BucketCmdContent => {
  const mainCmd = cmd;

  const subCmd = args[0] ? args[0].toLowerCase() : 'unknown';
  let bucketName = '';
  let newBucketName = '';

  //Find flag '~' in the args
  let newNameIdx = args.findIndex((arg) => arg.startsWith('~'));

  //All subCmds besides rename follow the same syntax
  if (subCmd === 'rename') {
    //Check if '~' exists then extract bucketName and newBucketName
    if (newNameIdx !== -1) {
      bucketName = formatVar(args, 1, newNameIdx);
      newBucketName = formatVar(args, newNameIdx, undefined, 1);
    }
  } else {
    bucketName = args.slice(1).join(' ').trim().replace(/\s+/g, ' ');
    bucketName = formatVar(args, 1);
  }

  return { mainCmd, subCmd, bucketName, newBucketName };
};

/**
 * Parses split command arguments from message content
 *
 * @param cmd - The main command
 * @param args - The arguments array containing the split command
 * @returns SplitCmdContent
 */
const parseSplitCmdContent = (cmd: string, args: string[]): SplitCmdContent => {
  const mainCmd = cmd;
  const subCmd = args[0] ? args[0].toLowerCase() : 'unknown';
  let splitName = '';
  let goal, bucketName, newSplitName;

  //Find flags '$', '>', and '~' in the args
  let goalIdx = args.findIndex((arg) => arg.startsWith('$'));
  let bucketIdx = args.findIndex((arg) => arg.startsWith('>'));
  let newNameIdx = args.findIndex((arg) => arg.startsWith('~'));

  //Check if goal flag exists for create and goal cmds, then set them
  if (goalIdx !== -1 && (subCmd === 'create' || 'goal')) {
    splitName = formatVar(args, 1, goalIdx);
    goal = parseInt(args[goalIdx].slice(1));
  }

  switch (subCmd) {
    case 'create':
      //If flag for bucketName exist
      if (bucketIdx !== -1) {
        bucketName = formatVar(args, bucketIdx, undefined, 1);
      }
      break;
    case 'delete':
    case 'del':
    case 'get':
      splitName = formatVar(args, 1);
      break;
    case 'rename':
      //If flag exists then extract splitName and newSplitName
      if (newNameIdx !== -1) {
        splitName = formatVar(args, 1, newNameIdx);
        newSplitName = formatVar(args, newNameIdx, undefined, 1);
      }
      break;
  }
  return { mainCmd, subCmd, splitName, newSplitName, goal, bucketName };
};

/**
 * Parses split command arguments from message content
 *
 * @param cmd - The main command
 * @param args - The arguments array containing the split command
 * @returns RecordCmdContent
 */
const parseRecordCmdContent = (
  cmd: string,
  args: string[]
): RecordCmdContent => {
  const mainCmd = cmd;
  const subCmd = args[0] ? args[0].toLowerCase() : 'unknown';
  const recordType = `${
    subCmd === 'add' ? 'Income' : subCmd === 'remove' ? 'Expense' : 'Transfer'
  }`;
  let splitName = '';
  let newSplitName;
  let note = '';
  let amount = 0;

  //Find flags '$', '>', '--', and '>>' in the args
  let amountIdx = args.findIndex((arg) => arg.startsWith('$'));
  let splitIdx = args.findIndex((arg) => arg.startsWith('>'));
  let newSplitIdx = args.findIndex((arg) => arg.startsWith('>>'));
  let noteIdx = args.findIndex((arg) => arg.startsWith('--'));

  if (amountIdx !== -1 && splitIdx !== -1 && noteIdx !== -1) {
    amount = parseInt(args[amountIdx].slice(1));
    note = formatVar(args, noteIdx, undefined, 2);

    if (subCmd === 'transfer' && newSplitIdx !== -1) {
      splitName = formatVar(args, splitIdx, newSplitIdx, 1);
      newSplitName = formatVar(args, newSplitIdx, noteIdx, 2);
    } else {
      splitName = formatVar(args, splitIdx, noteIdx, 1);
    }
  }

  return { mainCmd, subCmd, amount, splitName, newSplitName, note, recordType };
};

/**
 * Manages bucket commands by parsing the arguments and executing the
 * corresponding action
 *
 * @param msg - The message object for communication
 * @param cmd - The main command string
 * @param args - The arguments passed with the command
 */
const bucketCmdManager = async (msg: Message, cmd: string, args: string[]) => {
  const bucketArgs = parseBucketCmdContent(cmd, args);

  //Check if valid bucket data is present before executing
  if (!bucketArgs) {
    msg.channel.send('⏰ No valid **bucket data** is present...');
  } else {
    switch (bucketArgs.subCmd.toLocaleLowerCase()) {
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
      case 'rename':
        if (bucketArgs.newBucketName)
          renameBucket(msg, bucketArgs.bucketName, bucketArgs.newBucketName);
        break;
      //Handles unknown commands
      default:
        msg.channel.send(
          '💬 Unknown **!bucket** command... try:\n\n🟢 **Create Bucket**\n- !bucket **create** <bucketName>\n\n🔴 **Delete Bucket**\n- !bucket **delete** <bucketName>\n\n🔭 **Show Bucket Details**\n- !bucket **get** <bucketName>\n\n🔠 **Rename Bucket**\n- !bucket **rename** <bucketName> **~**<newBucketName>'
        );
    }
  }
};

/**
 * Manages split commands by parsing the command and argument content
 *
 * @param msg - The message object containing the command
 * @param cmd - The command string
 * @param args - The arguments passed with the command
 */
const splitCmdManager = async (msg: Message, cmd: string, args: string[]) => {
  const splitArgs = parseSplitCmdContent(cmd, args);

  if (!splitArgs) {
    msg.channel.send('⏰ No valid **split data** is present...');
  } else {
    switch (splitArgs.subCmd.toLowerCase()) {
      case 'create':
        if (splitArgs.goal && splitArgs.bucketName)
          createSplit(
            msg,
            splitArgs.splitName,
            splitArgs.goal,
            splitArgs.bucketName
          );
        break;
      case 'delete':
      case 'del':
        deleteSplit(msg, splitArgs.splitName);
        break;
      case 'get':
        getSplit(msg, splitArgs.splitName, true);
        break;
      case 'goal':
        if (splitArgs.goal)
          editSplitGoal(msg, splitArgs.splitName, splitArgs.goal);
        break;
      case 'rename':
        if (splitArgs.newSplitName)
          renameSplit(msg, splitArgs.splitName, splitArgs.newSplitName);
        break;
      //handle unknown commands
      default:
        msg.channel.send(
          '💬 Unknown **!split** command... try:\n\n✅ **Create Split**\n- !split **create** <splitName> **$**<goal> **>**<bucketName>\n\n🚮 **Delete Split**\n- !split **delete** <splitName>\n\n🔭 **Show Split Details**\n- !split **get** <splitName>\n\n🔠 **Rename Split**\n- !split **rename** <splitName> **~**<newSplitName>\n\n🎯 **Change Split Goal**\n- !split **goal** <splitName> **$**<newGoalAmount>'
        );
    }
  }
};

/**
 * Manages record commands by parsing the command and argument content
 *
 * @param msg - The message object containing the command
 * @param cmd - The command string
 * @param args - The arguments passed with the command
 */
export const recordCmdManager = async (
  msg: Message,
  cmd: string,
  args: string[]
) => {
  const recordArgs = parseRecordCmdContent(cmd, args);

  if (!recordArgs) {
    msg.channel.send('⏰ No valid **record data** is present...');
  } else {
    switch (recordArgs.subCmd.toLowerCase()) {
      case 'add':
      case 'remove':
        createRecord(
          msg,
          recordArgs.splitName,
          recordArgs.amount,
          recordArgs.note,
          recordArgs.recordType
        );
        break;
      case 'transfer':
        if (recordArgs.newSplitName)
          transfer(
            msg,
            recordArgs.amount,
            recordArgs.splitName,
            recordArgs.newSplitName,
            recordArgs.note
          );
        break;
      //Handles unknown commands
      default:
        msg.channel.send(
          '💬 Unknown **!record** command... try:\n\n🟢 **Create Income**\n- !record add **$**<amount> **>**<splitName> **--**<note>\n\n🔴 **Create Expense**\n- !record remove **$**<amount> **>**<splitName> **--**<note>\n\n🔀 **Transfer Between Splits**\n- !record transfer **$**<amount> **>**<splitName> **:**<newSplitName> **--**<note>'
        );
    }
  }
};
