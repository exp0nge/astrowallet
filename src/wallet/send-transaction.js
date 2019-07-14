const _ = require('lodash');
const ethers = require('ethers');
const { getProvider } = require('../util/ethereum/ethers');

const Wallet = require('../model/wallet');

// TODO add token support
const sendTransaction = async (sender, amount, token, to) => {

    const foundUser = await Wallet.findOne({ slackId: sender });

    // ensure slack user can only use own wallet
    if (foundUser.slackId !== sender) {
        throw new Error('Invalid user for wallet');
    }

    let walletWithProvider = new ethers.Wallet(foundUser.privateKey, getProvider());

    let transaction = {
        to,
        value: ethers.utils.parseEther(amount)
    };

    try {
        let sendResult = await walletWithProvider.sendTransaction(transaction);
        console.debug("sendResult", sendResult);
        return {
            message: `Transaction sent (pending): https://kovan.etherscan.io/tx/${sendResult.hash}`,
            txLink: `https://kovan.etherscan.io/tx/${sendResult.hash}`,
            success: true,
            data: {
                transactionSent: true,
                hash: sendResult.hash,
            }
        };
    } catch (err) {
        console.error(`unable to send: ${err}`);
        return {
            message: `unable to send: ${err}`,
            success: false,
            data: {
                transactionSent: false,
                hash: null,
            }
        };
    }
};

module.exports = sendTransaction;