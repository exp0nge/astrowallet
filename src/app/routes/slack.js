const _  = require('lodash');
const Router = require('koa-router');
const { SLACK_COMMANDS } = require('../../constants');
const {getClient} = require('../../util/slack/client');

const getWallet = require('../../wallet/get-wallet');
const sendTransaction = require('../../wallet/send-transaction');
const getBalance = require('../../wallet/get-balance');
const { getUserAddress } = require('../../util/slack/get-user');
const fromMnemonic = require('../../wallet/restore');

const router = new Router();

router.post('/', async (ctx, next) => {
    const slackClient = getClient();

    const body = ctx.request.body;
    const user = body['user_id'];

    const rawText = body['text'];
    const cmd = rawText.split(' ')[0];

    switch(cmd) {
        case SLACK_COMMANDS.CREATE:
            let result = await getWallet(user, true);
            ctx.response.body = result.message; 
            break;
        case SLACK_COMMANDS.RESTORE:
            let secret = rawText.split(' ')[1];
            if (secret.length > 0 && secret.startsWith("0x")) {
                let restoredResult  = await fromMnemonic(user, secret);
                ctx.response.body = restoredResult.message;
            } else {
                ctx.response.body = `Secret must not be empty and must start with 0x.`
            }
            break;
        case SLACK_COMMANDS.SEND:
            let rawCmd = rawText.split(' ');

            let recipient = rawCmd[1];
            let amount = rawCmd[2];
            let token = rawCmd[3];

            if (recipient !== undefined && amount !== undefined && token !== undefined) {
                let foundUser = await getUserAddress(recipient);
                let txResult = await sendTransaction(user, amount, token, foundUser.address);
                await slackClient.chat.postMessage({
                    channel: body['channel_id'],
                    text: `<@${body['user_id']}> sent ${amount} ${token} to <@${foundUser.userId}>`,
                    attachments: [
                        {
                            "text": `${txResult.txLink}`
                        }
                    ]
                });
                ctx.response.body = '';
            } else {
                ctx.response.body = `Unable to parse command: recipient: ${recipient}, amount: ${amount}, token: ${token}`;
            }
            break;
        case SLACK_COMMANDS.BALANCE:
            let wallet = await getWallet(user);
            let balanceResult = await getBalance(wallet.data.address);
            ctx.response.body = balanceResult.message;
            break;
        default:
            console.log(`Command not recognized: ${cmd}`);
            break;
    }
    
    await next();
});

module.exports = router;