const axios = require("axios");
const cheerio = require("cheerio");
const XenNode = require("xen-node");
const GistMan = require("./gistman");

const timeout = 30000;
const interval = 60000;
const URL = process.env.URL;
const TWITTER = process.env.TWITTER;
const THREAD_ID = process.env.THREAD_ID;
const GIST_TOKEN = process.env.GIST_TOKEN;
const FILE_ID = process.env.FILE_ID;
const FILE_NAME = process.env.FILE_NAME;
const COOKIE = JSON.parse(process.env.COOKIE);

const req = new XenNode(URL);
const giz = new GistMan(GIST_TOKEN);

function postingDeleyed(data) {
  setTimeout(main, data.length * timeout + interval); // call main recursively with delays
  data.forEach((tweet, idx) => {
    setTimeout(() => {
      req
        .checkLogin(COOKIE)
        .then(() => req.post(`[MEDIA=twitter]${tweet}[/MEDIA]`, THREAD_ID))
        .catch(() => console.log("xenNodeError"));
    }, idx * timeout);
  });
}

function filterTweets(data) {
  giz
    .read(FILE_ID, FILE_NAME)
    .then((gResp) => {
      gResp = BigInt(gResp);
      let fTweets = data.filter((fil) => fil > gResp);
      if (fTweets.length > 0) {
        giz
          .update(FILE_ID, FILE_NAME, fTweets[0])
          .catch(() => console.log("gistManUpdateError"));
        postingDeleyed(fTweets);
      } else {
        setTimeout(main, interval); // if not have new tweets call main recursively
      }
    })
    .catch(() => console.log("gistManReadError"));
}

function main() {
  axios
    .get(
      `https://syndication.twitter.com/timeline/profile?screen_name=${TWITTER}` // magic twitter url :)
    )
    .then((resp) => {
      let $ = cheerio.load(resp.data.body);
      let allTweets = $(".timeline-Tweet")
        .toArray()
        .map((element) => BigInt($(element).attr("data-tweet-id")));
      filterTweets(allTweets);
    })
    .catch((error) => console.log(error));
}

console.log("rodando");
main();
