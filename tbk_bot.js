/*
 * TBK LINE BOT
 */

/* Node Module */
var request = require('request');
var aws = require('aws-sdk');

/* DynamoDB Constant */
const dynamo = new aws.DynamoDB();
const tableName = '<DBName>';

/* LINE BOT API Constant */
const LINE_ENDPOINT = 'https://api.line.me/v2/bot/message/reply';
const LINE_AUTH = 'Bearer <Channel Access Token>';
const LINE_CONTENT_TYPE_TEXT = 'text';
const LINE_CONTENT_TYPE_IMAGE = 'image';
const LINE_CONTENT_TYPE_VIDEO = 'video';
const LINE_CONTENT_TYPE_AUDIO = 'audio';
const LINE_CONTENT_TYPE_LOCATION = 'location';
const LINE_CONTENT_TYPE_STICKER = 'sticker';
const LINE_CONTENT_TYPE_RICH_MESSAGE = 'imagemap';


/* Docomo API Constant */
const DOCOMO_ENDPOINT = "https://api.apigw.smt.docomo.ne.jp/dialogue/v1/dialogue";
const DOCOMO_QUERY_PARAM = "APIKEY";
const DOCOMO_APIKEY = "<MyAPIKey>";
const DOCOMO_DIALOGUE_CHARACTOR_JK = 20;
const DOCOMO_DIALOGUE_CHARACTOR_BABY = 30;
const DOCOMO_CONTEXT_DUMMY = "XXXXXX";
const DOCOMO_MODE_DIALOG = "dialog";
const DOCOMO_MODE_SIRITORI = "str";

/* Docomo API Variable */
var docomoContext;
var docomoMode;

/* Common Constant */
const JSON_CONTENT_TYPE = 'application/json';
const HTTP_METHOD = 'post';
const DELETE_TIME = 120*60*1000;


/*
 1. userIdがDynanoDB存在するかチェック
    存在している、且つ 2時間以内の場合、Docomo APIのContextを利用
    存在しているが2時間以上経過している場合、データを削除し、Docomo API Contextは空
    存在していない場合、Docomo API Contextは空

 2. Docomo API呼び出し
    テキストデータとContextを受取

 3. LINEへ返却

 4. userIdとDocomo API ContextでDynanoDBを上書き

*/

/* DynanoDB Check */
function checkDynanoDB(userId) {
  /* DyanmoDB Parameter */
  var paramDynamo = {
    "TableName" : tableName,
    "KeyConditions": {
      "mid": {
        AttributeValueList:[{"S" : userId }],
        ComparisonOperator: 'EQ'
      }
    }
  };


  dynamo.query(paramDynamo, (err, data) => {
    if(err) {
      console.log("Query:"+err,err.stack);
      return ;
    } else {
      if(data.Count > 0) {

        // 規定時間チェック
        var dydate = data.Items[0].date.N;
        var dt = new Date();
        var currentTime = dt.getTime();
        if(currentTime - dydate < DELETE_TIME) {
          docomoContext = data.Items[0].context;
          docomoMode = data.Items[0].mode;
        } else {

          // 2時間以上経過のため削除
          var dynamoDeleteRequest = {
              TableName: tableName,
              Key : {
                "mid" : {"S": userId}
              }
          };

          /* 削除 */
          dynamo.deleteItem(dynamoDeleteRequest, (err, data) => {
            if(err) {
              console.log("Delete:"+err,err.stack);
              return ;
            } else {
              console.log("Delete:success");
            }
          });
        }
      }
    }
  });

}



/* LINE BOT SEND */
function sendLine (mid, text) {

  var dataSendLine = {
    'replyToken': mid,
    'messages': [{
      'type': LINE_CONTENT_TYPE_TEXT,
      'text': text
    }]
  };

  var headerLine = {
    'Content-Type': JSON_CONTENT_TYPE,
    'Authorization': LINE_AUTH
  };

  var optionsLine = {
    uri: LINE_ENDPOINT,
    method: HTTP_METHOD,
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
function fetchDocomoAPI(mid, text) {
  if(docomoMode == null) docomoMode = DOCOMO_MODE_DIALOG;
  var dataDocomoRequest = {
    'utt': text,
    'mode': docomoMode,
    'context': docomoContext,
    't': DOCOMO_DIALOGUE_CHARACTOR_JK
  };

  var optionsDocomo = {
    uri: DOCOMO_ENDPOINT+"?"+DOCOMO_QUERY_PARAM+"="+DOCOMO_APIKEY,
    method: HTTP_METHOD,
    headers: {'Content-Type': JSON_CONTENT_TYPE},
    json: true,
    body: dataDocomoRequest
  };
  var getData = function(error, response, data) {
    console.log('DOCOMO_RECIVE:' + data.utt);
    docomoContext = data.context;
    docomoMode = data.mode;
    sendLine(mid, data.utt);
  };
  request(optionsDocomo, getData);
};

var dynamoInsert = function (userId, contx, mode) {
  var now = new Date();
  if (contx == null) contx = ;
  var insertParam = {
    "TableName" : tableName,
    "Item": {
      "mid" : {"S": userId},
      "date" : {"N":String(now.getTime())},
      "context" : {"S" :contx},
      "mode": {"S": mode}
    }
  };
  console.log(insertParam);
  dynamo.putItem(insertParam, function(err, data){
    if (err) {
      console.log("Insert:"+err,err.stack);
      context.fail('error','put item  dynamodb failed: '+err);
    } else {
      console.log(data);
    }
  });
};

function main() {
  return new Promise(function (resolve){});
};

/* Lambda */
exports.handler = function(event, context) {
    var events = event.events;
    for(var i in events) {
      /* replyTokenとuserIdを変数へセット */
      replyToken = events[i].replyToken;
      userId = events[i].source.userId;
      console.log('LINE_RECIVE:' +userId+":"+ events[i].message.text);

      /* 数珠つなぎ */
      main()
      .then(checkDynanoDB(userId))
      .then(fetchDocomoAPI(replyToken, events[i].message.text))
      .then(dynamoInsert(userId, docomoContext, docomoMode));
    }
};
