const express = require('express')
const app = express();
const logger = require('./utils/logger');
var winston = require('winston');
var expressWinston  = require('express-winston');
//const bodyParser = require('body-parser');
const axios = require('axios');
const keys = require('./config/keys');
const querystring = require('querystring');
const { json } = require('express');
const uuid = require('uuid');
const port = keys.listen_port || 3000;
const apiTimeout = keys.api_timeout || 5000;
const returnFullError = keys.return_full_error || false;
//app.use(bodyParser.json({limit:'1mb'}));

const baseFolder = keys.log_base_folder || 'logs'
const transport = new winston.transports.DailyRotateFile({
    filename: baseFolder + `/ReactNativeAPI-REQUEST-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '10m',
    maxFiles: '365d'
  });
const transportError = new winston.transports.DailyRotateFile({
    filename: baseFolder + `/ReactNativeAPI-ERROR-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '10m',
    maxFiles: '365d'
  });

// Log the whole request and response body
expressWinston.requestWhitelist.push('body');
expressWinston.responseWhitelist.push('body');
expressWinston.responseWhitelist.push('_headers');

// Logger makes sense before the router
app.use(expressWinston.logger({
    format:winston.format.combine(winston.format.timestamp({format:'YYYY-MM-DD_HH:mm:ss.sss'}),winston.format.json()),
    transports: [
        transport
      ]
  }));

app.set("etag", false);
app.use(function(req, res, next) {
    const correlationId = req.get(keys.headers.correlation_id) || uuid.v4();
    res.setHeader(keys.headers.correlation_id, correlationId);
    res.removeHeader("X-Powered-By");
    next();
});

logger.info("Application Started !!!");

app.get('/webapi/mac/v1/members/:mem_code/:mem_id', async (req, res) => {
    const {mem_code, mem_id} = req.params;
    const correlationId = res.getHeader(keys.headers.correlation_id);
    logger.info(`call v2 start - id: ${mem_code}_${mem_id} url: ${req.url} ${LoggerPostfix(correlationId)}`);

    try {
        if(mem_id && !isNaN(mem_code) && !isNaN(mem_id)){
            const body = {mem_code: mem_code, mem_id: mem_id, error: ''};
            //logger.info(`body: ${JSON.stringify(body)} ${LoggerPostfix(correlationId)}`);
            res.json(body);
        }
        else {
            logger.error(`Invalid Id: mem_code: ${mem_code}, mem_id: ${mem_id} ${LoggerPostfix(correlationId)}`);
            res.status(500).json({mem_code: '', mem_id: '', error: `Invalid Id`});
        }
    } 
    catch (err) {
        logger.error(`error while calling id: ${mem_code}_${mem_id} error: ${err} ${LoggerPostfix(correlationId)}`);
        res.status(500).json({url: '', error: returnFullError ? err : `Oops! Something went wrong! Please see log for details ${LoggerPostfix(correlationId)}`});
    }
})

// Error logger makes sense after the router
app.use(expressWinston.errorLogger({
    transports: [
        transportError
    ]
  }));

app.listen(port, () => console.log(`app listening on port ${port}!`))

const getAxiosConfig = (correlationId) =>{
    return {
        headers: {
            [keys.headers.correlation_id]: correlationId
        },
        timeout: apiTimeout 
    }
}

async function GetRidercetURL(id, query, event, correlationId) {
    //console.log("id: ", id, "query: ", query, "event: ", event, " CorrelationId: ", correlationId);
    let result;
    if (id.length > 5) {
        const url = keys.generic_api + urlStart + id + '/';
        logger.info("call generic: " + url + LoggerPostfix(correlationId));
        await axios.get(url)
        .then(res => {
            logger.info(`call generic success ${LoggerPostfix(correlationId)}`);
            //console.log("axios get success: ", res.status, " ", res.data);
            result = GetURL(res, event, correlationId);

        })
        .catch(err => {
            logger.error(`error while call generic: ${url} error: ${err} ${LoggerPostfix(correlationId)}`);
            //console.log("axios get error: ", err);
            result = null;
        });
    }
    else {
        const url = `${keys.cms_api}${urlStart}${id}/?${querystring.stringify(query)}`;
        logger.info("call cms: " + url + LoggerPostfix(correlationId));
        await axios.get(url, getAxiosConfig(correlationId))
        .then(res => {
            //console.log("axios get success: ", res.data);
            result = GetURL(res, event, correlationId);
        })
        .catch(err => {
            //console.log("axios get error: ", err);
            logger.error(`error while call cms: ${url} error: ${err} ${LoggerPostfix(correlationId)}`);
            result = null;
        });
    }

    return result;
    //console.log("result: " + result, " keys: " ,Object.keys(result));
}

function GetURL(result, event, correlationId) {
    const { data } = result;
    if(data && data !== 'undefined'){
        let urlToRedirect = addQueryStringToLongUrl(data, event);
        logger.info("urlToRedirect: " + urlToRedirect + LoggerPostfix(correlationId));
        
        return urlToRedirect;
    }
    else {
        logger.info("no data returend" + LoggerPostfix(correlationId));

        return null;
    }
}

function LoggerPostfix(correlationId){
    return ` | CorrelationId: ${correlationId}`
} 

