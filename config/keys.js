

console.log(process.env.NODE_ENV);


if(process.env.NODE_ENV.trim() === 'prod'){
    module.exports = require('./prod')
}else if (process.env.NODE_ENV.trim() ==='test'){
    module.exports = require('./test')
}else if (process.env.NODE_ENV.trim() ==='qa'){
    module.exports = require('./qa')
}else{
    module.exports = require('./dev')
}