# 🤖💸📈 Expense Tracking Discord Bot

This bot was built using a few really cool tools:

- 🥟 **[Bun.js](https://bun.sh/)**
- 🟦 **[Typescript](https://www.typescriptlang.org/)**
- 🤖 **[Discord.js](https://discord.js.org/)**
- 🔼 **[Prisma ORM](https://www.prisma.io/)**
- 🐘 **PostgreSQL DB**

## 💻 How it works

This bot is **currently in a beta-ish state**.

The bot operates by parsing through commands sent on the discord server.

### Creating Transaction Records

- **!add** _amount_ _categoryName_ --_optional comment_
- **!remove** _amount_ _categoryName_ --_optional comment_
  > **Example:** !add 350 Rent Funds --Pet Fee 175ea.

_You can have spaces in your names and comments =}_

### CRUD Categories/Buckets

- **!create** _categoryName_
- **!delete** _categoryName_
- **!get** _categoryName_
  > **Example:** !delete Rent Funds

Once a correctly structured command is detected, the bot triggers specific actions to handle each task by using Prisma to interact with a PostgreSQL database.

## 🔮 Future

The bot currently meets my needs on my private server. But a couple things are currently being worked on:

1. Renaming buckets
2. Setting/editing a bucket goal
3. Deleting transaction records
4. Better feedback to user in chat

## 📊 Frontend UI

A **react-based** UI is currently being worked on to connect with the bot and it's db. **Which will provide charts, tracking, and other responsible grown-up things.** This will allow synchronicity and flexibility across the desktop and mobile browsers and chatting with the bot on discord.
