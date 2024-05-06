# 🤖💸📈 Expense Tracking Discord Bot

This bot was built using a few really cool tools:

- 🥟 **[Bun.js](https://bun.sh/)**
- 🟦 **[Typescript](https://www.typescriptlang.org/)**
- 🤖 **[Discord.js](https://discord.js.org/)**
- 🔼 **[Prisma ORM](https://www.prisma.io/)**
- 🐘 **PostgreSQL DB**

## 💻 How it works

This bot is **currently in a beta-ish state**.

### 🪣 Buckets

- **!bucket create** _name_
- **!bucket delete/del** _name_
- **!bucket get** _name_

> _You can have spaces in your names_<br/>
> Example: **!bucket create Emergency Funds <br/><br/>** > _Commands are also case insensitive_<br/>
> Example: **!bucket get emergency funds**

### 💰 Splits

- **Currently being reworked**

### 💵 Transaction Records

- **Currently being reworked**

Once a correctly structured command is detected, the bot triggers specific actions to handle each task by using Prisma to interact with a PostgreSQL database.

The structure is fairly straight forward, A bucket can contain multiple splits which contain transaction records of income, expenses, and transfers.

> 🪣 Monthly Bills<br/>
> 💰 Rent

## 🔮 Future

The bot currently meets my needs on my private server. But a couple things are currently being worked on:

1. Renaming buckets
2. Setting/editing a bucket goal
3. Deleting transaction records
4. Better feedback to user in chat

## 📊 Frontend UI

A **react-based** UI is currently being worked on to connect with the bot and it's db. **Which will provide charts, tracking, and other responsible grown-up things.** This will allow synchronicity and flexibility across the desktop and mobile browsers and chatting with the bot on discord.
