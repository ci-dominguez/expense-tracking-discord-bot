# 🤖💸📈 Expense Tracking Discord Bot

This bot was built using a few really cool tools:

- 🥟 **[Bun.js](https://bun.sh/)**
- 🟦 **[Typescript](https://www.typescriptlang.org/)**
- 🤖 **[Discord.js](https://discord.js.org/)**
- 🔼 **[Prisma ORM](https://www.prisma.io/)**
- 🐘 **PostgreSQL DB**

## 💻 Commands

This bot is **currently in a beta-ish state**. Once a correctly structured command is detected, the bot triggers specific actions to handle each task by using Prisma to interact with a PostgreSQL database.

🚩 Command Flags<br/>
**$** - Amount of money (goal and transfer amounts)<br/>
**>** - In (creating an item in parent)<br/>
**>>** - To (item receiving transfer)<br/>
**~** - New (renaming)<br/>
**--** - Note (description for record)
<br/>

### 🪣 Buckets

🟢 **Create Bucket** <br/>
!bucket create bucketName

🔴 **Delete Bucket** <br/>
!bucket delete bucketName

🔭 **Show Bucket Details** <br/>
!bucket get bucketName

🔠 **Rename Bucket** <br/>
!bucket rename bucketName ~newBucketName
<br/><br/>

### 💰 Splits

✅ **Create Split** <br/>
!split create splitName $goal >bucketName

🚮 **Delete Split** <br/>
!split delete splitName

🔭 **Show Split Details** <br/>
!split get splitName

🔠 **Rename Split** <br/>
!split rename splitName ~newSplitName

🎯 **Change Split Goal** <br/>
!split goal splitName $newGoalAmount
<br/><br/>

### 💵 Transaction Records

🟢 **Create Income** <br/>
!record add $amount >splitName --note

🔴 **Create Expense** <br/>
!record remove $amount >splitName --note

🔀 **Transfer Between Splits** <br/>
!record transfer $amount >splitName >>newSplitName --note

## 🔮 Future

Although most base functions of the bot are completed. I'll be working on more quality-of-life features like:

1. Reminders/alerts through scheduled and stat-based pings in the server
2. More involved tracking and statistics
3. Better text-based feedback and visual feedback like graph and chart images
4. Webapp to synchronize with the bot
5. Anything else that comes up

## 📊 Web App

A **react-based** webapp is currently being worked on to connect with the bot and your database. **_Which will provide charts, tracking, and other responsible grown-up things_.** This will allow synchronicity and flexibility across the desktop and mobile browsers and chatting with the bot on discord.
