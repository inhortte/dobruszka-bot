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
bot.command("advice", ({ reply }) => {
  let m = adviceRe.exec(
    combinedAbsurdity[Math.floor(Math.random() * combinedAbsurdity.length)]
  );
  if (m) {
    return reply(m[1]);
  } else {
    return reply("Nothing for the likes of a worm like Christian Newman");
  }
});

bot.command(["pos", "piece", "shit"], ({ reply }) => {
  return reply(pieceOfShit[Math.floor(Math.random() * pieceOfShit.length)]);
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
bot.settings(async (ctx) => {
  await ctx.setMyCommands([
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
  ]);
  return ctx.reply("Ok");
});
bot.help(async (ctx) => {
  const commands = await ctx.getMyCommands();
  const info = commands.reduce(
    (acc, val) => `${acc}/${val.command} - ${val.description}\n`,
    ""
  );
  return ctx.reply(info);
});
/*
bot.hears("thurk", (ctx) => ctx.reply("Christian is a WORM")); // listen and handle when user type hi text
bot.hears(/^\s*dob[ruszška,:]*\s+(.+)$/i, polishRequest);
*/
bot.launch(); // start
