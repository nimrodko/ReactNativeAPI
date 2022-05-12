var winston = require('winston');

require('winston-daily-rotate-file');
const keys = require('../config/keys');
//const { combine, timestamp, json} = winston.format;

const baseFolder = keys.log_base_folder || 'logs'

const transport = new winston.transports.DailyRotateFile({
  filename: baseFolder + `/ReactNativeAPI-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '10m',
  maxFiles: '365d'
});

const logFormat = winston.format.combine(
  winston.format.timestamp({format:'YYYY-MM-DD HH:mm:ss.sss'}),
  winston.format.align(),
  winston.format.printf(
   info => `${info.timestamp} ${info.level}:${info.message}`
 ),);

var logger = winston.createLogger({
    level:'silly',
    format: logFormat,
    //format:combine(timestamp(),json()),
    // defaultMeta:{ service: 'user-service' },
    transports: [ 
      transport
    ]
    // transports: [
    //     //
    //     // - Write to all logs with level `info` and below to `combined.log` 
    //     // - Write all logs error (and below) to `error.log`.
    //     //
    //     new winston.transports.File({ filename: 'error.log',timestamp:true, level: 'error' }),
    //     // new winston.transports.File({ filename: 'info.log', level: 'info' }),
    //     new winston.transports.File({ filename: 'combined.log',timestamp:true ,level: 'info'}),
    //   ]
});

module.exports = logger;