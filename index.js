const Telegraf = require("telegraf"); // import telegram lib
const Extra = require("telegraf/extra");
const Markup = require("telegraf/markup");
const R = require("ramda");
const { Pool } = require("pg");
const fs = require("fs");
const bot = new Telegraf(process.env.KH_BOT_TOKEN); // get the token from envirenment variable

const pgPool = new Pool({
  host: "localhost",
  user: "polaris",
  database: "leper",
});
const pgLakife = new Pool({
  host: "localhost",
  user: "polaris",
  database: "lakife",
});
const pgBooks = new Pool({
  host: "localhost",
  user: "polaris",
  database: "books"
});

let combinedAbsurdity = fs
  .readFileSync("./combined-absurdity.txt")
  .toString()
  .split(/\n/)
  .filter((line) => line.match(/\+\+\+\$\+\+\+/));

let pieceOfShit = fs
  .readFileSync(
    "/home/polaris/various-leprosies/draining-the-pond/piece-of-shit.txt"
  )
  .toString()
  .split(/\n/)
  .filter((line) => line.trim().length > 0);

const adviceRe = new RegExp("\\+\\+\\+\\$\\+\\+\\+\\s+(.+)$");
bot.command("advice", ({ message, reply }) => {
  let _m = /advice\s+(.+)$/.exec(message.text);
  let cA = combinedAbsurdity;
  if (_m) {
    let [_beanie, toGrok] = _m;
    let re = new RegExp(toGrok.trim().split(/\s+/).join(" "), "i");
    cA = combinedAbsurdity.filter((line) => re.exec(line));
  }
  let m = adviceRe.exec(cA[Math.floor(Math.random() * cA.length)]);
  if (m) {
    return reply(m[1]);
  } else {
    return reply("Nothing for the likes of a worm like Christian Newman");
  }
});

bot.command(["pos", "piece", "shit"], ({ reply }) => {
  return reply(pieceOfShit[Math.floor(Math.random() * pieceOfShit.length)]);
});

bot.command("lv", ({ message, reply }) => {
  if (message.text && R.compose(R.not, R.empty, R.trim)(message.text)) {
    let m = /lv\s+(.+)$/.exec(message.text);
    if (m) {
      (async () => {
        const pgClient = await pgLakife.connect();
        try {
          let [_, _qTerm] = m;
          let qTerm = R.compose(R.replace(/'/, "''"), R.trim)(_qTerm);
          let query = `select lakife, english from vocabulary where lakife ~* '${qTerm}' or english ~* '${qTerm}';`;
          let res = await pgClient.query(query);
          if (res && res.rows && res.rows.length > 0) {
            R.compose(
              (r) => reply(r),
              R.join("\n"),
              R.map((row) => `${row.lakife}: ${row.english}`),
              R.slice(0, 3)
            )(res.rows);
          } else {
            reply("That does not yet exist.");
          }
        } finally {
          pgClient.release();
        }
      })();
    }
  }
});

bot.command("lp", ({ message, reply }) => {
  if (message.text && R.compose(R.not, R.empty, R.trim)(message.text)) {
    let m = /lp\s+(.+)$/.exec(message.text);
    if (m) {
      (async () => {
        const pgClient = await pgLakife.connect();
        try {
          let [_, _qTerm] = m;
          let qTerm = R.compose(R.replace(/'/, "''"), R.trim)(_qTerm);
          let query = `select lakife, english from phrases where lakife ~* '${qTerm}' or english ~* '${qTerm}';`;
          let res = await pgClient.query(query);
          if (res && res.rows && res.rows.length > 0) {
            R.compose(
              (r) => reply(r),
              R.join("\n-------\n"),
              R.map((row) => `${row.lakife}\n${row.english}`),
              R.slice(0, 2)
            )(res.rows);
          }
        } finally {
          pgClient.release();
        }
      })();
    }
  }
});

bot.command("vagina", ({ reply }) => {
  reply("You need a beer, vole.");
});

bot.command("koran", ({ message, reply }) => {
  if (message.text && R.compose(R.not, R.empty, R.trim)(message.text)) {
    let m = /koran\s+(.+)$/.exec(message.text);
    let qTerm;
    if (m) {
      let [_, _qTerm] = m;
      qTerm = _qTerm;
    }
    (async () => {
      const pgClient = await pgBooks.connect();
      try {
        let count = 6236;
        if(!qTerm) {
          let id = Math.floor(Math.random() * count);
          let query = `select chapter, verse, text from koran where id = ${id};`;
          console.log(`query -> ${query}`);
          let res = await pgClient.query(query);
          if(res && res.rows && res.rows.length > 0) {
            reply(`Chapter ${res.rows[0].chapter} - Verse ${res.rows[0].verse}\n${res.rows[0].text}`);
          } else {
            reply("By the grace of Allah, you shall die the flame death.");
          }
        } else {
          qTerm = R.compose(R.replace(/'/, "''"), R.trim)(qTerm);
          let query = `select chapter, verse, text from koran where text ~* '${qTerm}';`;
          let res = await pgClient.query(query);
          if (res && res.rows && res.rows.length > 0) {
            R.compose(
              (rows) => {
                let chosenOne = R.nth(Math.floor(Math.random() * R.length(rows)), rows);
                reply(`Chapter ${chosenOne.chapter} - Verse ${chosenOne.verse}\n${chosenOne.text}`);

              }
            )(res.rows);
          } else {
            reply("By the grace of Allah, you shall die the flame death.");
          }
        }
      } finally {
        pgClient.release();
      }
    })();
  }
});

bot.command("quote", ({ message, reply }) => {
  // console.log(`The message was: ${JSON.stringify(message)}`);
  if (message.text && R.compose(R.not, R.empty, R.trim)(message.text)) {
    let quote, author;
    let m = /quote\s+(.+)\s+\((.+)\)\s*(.*)$/.exec(message.text);
    if (m) {
      let [_nic, part1, _author, part2] = m;
      quote = `${part1} ${part2}`.split(/\s+/).join(" ");
      author = _author;
    } else {
      let _m = /quote\s+(.+)$/.exec(message.text);
      if (_m) {
        let [_nada, oogleboobie] = _m;
        author = `${message.from.first_name || ""} ${
          message.from.last_name || ""
        }`;
        if (R.compose(R.empty, R.trim)(author)) {
          author = message.from.username;
        }
        quote = oogleboobie;
      }
    }
    if (quote && author) {
      (async () => {
        console.log(`Quote: ${quote} - Author: ${author}`);
        const pgClient = await pgPool.connect();
        try {
          quote = R.replace(/'/g, "''", quote);
          author = R.replace(/'/g, "''", author);
          pgClient.query(
            `insert into tentative_quotes(quote, author, leper, fecha) values('${quote}', '${author}', '${message.from.username}', CURRENT_DATE)`
          );
          let pos = pieceOfShit[
            Math.floor(Math.random() * pieceOfShit.length)
          ].toLowerCase();
          reply(
            `The quote "${quote}" by ${author} has been added for consideration, you ${pos}.`
          );
        } finally {
          pgClient.release();
        }
      })();
    }
  }
});

/*
bot.command("help", ({ reply }) => {
  return reply(
    "/advice - better ways to be alive in a world of fury and rot\n/pos - fecal nuggets\n/quote [text] - submit a quote for consideration by the master race"
  );
});
*/

const polishRequest = (ctx) => {
  if (ctx.match) {
    let [_, req] = ctx.match;
    if (req) {
      ctx.reply(JSON.stringify(ctx.from.first_name) + " babbled: " + req);
    }
  }
};

bot.start((ctx) => ctx.reply("You, Die!")); // display Welcome text when we start bot
const commands = [
  {
    command: "/advice",
    description: "Better ways to be alive in a world of fury and rot.",
  },
  {
    command: "/pos",
    description: "Fecal nuggets.",
  },
  {
    command: "/quote",
    description:
      "Submit a quote for consideration by the master race. If you are not the author, which you really shouldn't be because that would be preposterously arrogant, place him, her or it in parentheses at the end of the quote.",
  },
];

bot.help(async (ctx) => {
  console.log(`bot commands: ${JSON.stringify(commands)}`);
  /*
  const info = R.compose(
    R.join("\n"),
    R.map((c) => {
      return c.command;
    })
  )(commands);
  */
  const info = commands.reduce(
    (acc, val) => `${acc}${val.command} - ${val.description}\n`,
    ""
  );
  return ctx.reply(info);
});
/*
bot.hears("thurk", (ctx) => ctx.reply("Christian is a WORM")); // listen and handle when user type hi text
bot.hears(/^\s*dob[ruszška,:]*\s+(.+)$/i, polishRequest);
*/
bot.launch(); // start
