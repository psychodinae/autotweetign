const axios = require("axios");
const cheerio = require("cheerio");
const XenNode = require("xen-node");
const GistMan = require("./gistman");

const URL = process.env.URL;
const TWITTER = process.env.TWITTER;
const THREAD_ID= process.env.THREAD_ID;
const GIST_TOKEN = process.env.GIST_TOKEN;
const FILE_ID = process.env.FILE_ID;
const FILE_NAME = process.env.FILE_NAME;
const COOKIE = JSON.parse(process.env.COOKIE);

const req = new XenNode(URL);
const giz = new GistMan(GIST_TOKEN);

function postingDeleyed(data) {
  data.forEach((tweet, idx) => {
    setTimeout(() => {
      console.log("postando");
      req
        .checkLogin(COOKIE)
        .then(() => req.post(`[MEDIA=twitter]${tweet}[/MEDIA]`, THREAD_ID))
        .catch(() => console.log("xenNodeError"));
    }, idx * 30000);
  });
}

function filterTweets(data) {
  giz
    .read(FILE_ID, FILE_NAME)
    .then((gResp) => {
      gResp = parseInt(gResp);
      let fTweets = data.filter((fil) => fil > gResp);
      if (fTweets.length > 0) {
        giz.update(FILE_ID, "nodetweet", fTweets[0]);
        postingDeleyed(fTweets);
      }
    })
    .catch(() => console.log("gistManError"));
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
        .map((element) => parseInt($(element).attr("data-tweet-id")));
      filterTweets(allTweets);
    })
    .catch((error) => console.log(error));
}

console.log("rodando");
setInterval(() => main(), 60000);
