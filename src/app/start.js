const compress = require('koa-compress');
const consoleLogger = require('koa-logger');
const cors = require('koa-cors');
const helmet = require('koa-helmet');
const bodyParser = require('koa-bodyparser');
const Koa = require('koa');
const signale = require('signale');
const { getProvider } = require('../util/ethereum/ethers');

const { logError } = require('../util/error-logger');
const error = require('./middleware/error');
const invalidUrl = require('./middleware/invalid-url');
const slackValidator = require('./middleware/slack-validator');
const routes = require('./routes');

const logger = signale.scope('application');

const start = async port => {
    const app = new Koa();

    app.on('error', (err, { request }) => {
        logError(err, { request });
    });

    app.use(error());
    app.use(helmet());
    app.use(cors());
    app.use(consoleLogger());
    app.use(bodyParser());
    app.use(slackValidator());
    app.use(compress());
    app.use(routes());
    app.use(invalidUrl());

    const currentBlockNumber = await getProvider().getBlockNumber();

    app.listen(port);

    if (process.env.NODE_ENV === 'development') {
        logger.start(`serving application at http://localhost:${port}, blockNumber: ${currentBlockNumber}`);
    } else {
        logger.start(`serving application on port ${port}`);
    }
};

module.exports = start;