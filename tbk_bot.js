/*
 * TBK LINE BOT
 */

 /* Node Module */
 var request = require('request');

/* LINE BOT API Constant */
const LINE_ENDPOINT = 'https://trialbot-api.line.me/v1/events';
const LINE_CHANNEL_ID = '<myChannelID>';
const LINE_CHANNEL_SECRET = '<myChannelSecret>';
const LINE_MID = '<myMID>';
const LINE_TO_CHANNEL = '1383378250';
const LINE_EVENT_TYPE = '138311608800106203';
const LINE_CONTENT_TO_TYPE = 1;
const LINE_CONTENT_TYPE_TEXT = 1;
const LINE_CONTENT_TYPE_IMAGE = 2;
const LINE_CONTENT_TYPE_VIDEO = 3;
const LINE_CONTENT_TYPE_AUDIO = 4;
const LINE_CONTENT_TYPE_LOCATION = 7;
const LINE_CONTENT_TYPE_STICKER = 8;
const LINE_CONTENT_TYPE_RICH_MESSAGE = 12;


/* Docomo API Constant */
const DOCOMO_ENDPOINT = "https://api.apigw.smt.docomo.ne.jp/dialogue/v1/dialogue";
const DOCOMO_QUERY_PARAM = "APIKEY";
const DOCOMO_APIKEY = "<MyAPIKey>";
const DOCOMO_DIALOGUE_CHARACTOR_JK = 20;
const DOCOMO_DIALOGUE_CHARACTOR_BABY = 30;

/* Common Constant */
const JSON_CONTENT_TYPE = 'application/json';


/* LINE BOT SEND */
function sendBot (mid, text) {

  var dataSendLine = {
    'to': [mid],
    'toChannel': LINE_TO_CHANNEL,
    'eventType': LINE_EVENT_TYPE,
    'content': {
      'contentType': LINE_CONTENT_TYPE_TEXT,
      'toType': LINE_CONTENT_TO_TYPE,
      'text': text
    }
  };

  var headerLine = {
    'Content-Type': JSON_CONTENT_TYPE,
    'X-Line-ChannelID': LINE_CHANNEL_ID,
    'X-Line-ChannelSecret': LINE_CHANNEL_SECRET,
    'X-Line-Trusted-User-With-ACL': LINE_MID
  };

  var optionsLine = {
    uri: LINE_ENDPOINT,
    method: 'post',
    headers: headerLine,
    json: true,
    body: dataSendLine
  };

  request(optionsLine, (error, response, data) => {
    if(error) {
      console.log('ERROR:'+error);
    }
    console.log(data);
  });
};

/* Docomo API call */
function getDocomoAPI(mid, text) {
  var optionsDocomo = {
    uri: DOCOMO_ENDPOINT+"?"+DOCOMO_QUERY_PARAM+"="+DOCOMO_APIKEY,
    method: 'post',
    headers: {'Content-Type': JSON_CONTENT_TYPE},
    json: true,
    body: {'utt': text, 't': DOCOMO_DIALOGUE_CHARACTOR_JK}
  };
  var getData = function(error, response, data) {
    console.log('DOCOMO_RECIVE:' + data.utt);
    //return data.utt
    sendBot(mid, data.utt);
  };
  request(optionsDocomo, getData);
};

/* Lambda */
exports.handler = function(event, context) {
    var result = event.result;
    for(var i in result) {
      var mid = result[i].content.from;
      console.log('LINE_RECIVE:' + result[i].content.text);
      getDocomoAPI(mid, result[i].content.text);
      //console.log('DOCOMO_RECIVE:' + text);
      //sendBot(mid, text);
    }
};
