const _ = require('lodash');
const ethers = require('ethers');

const Wallet = require('../model/wallet');
const getWallet = require('./get-wallet');

const fromMnemonic = async (userId, privateKey) => {
    const restoreFailure = {
        message: `Failed to restore wallet from seed`,
        success: false,
        data: {
            walletRestored: false
        }
    };

    const existingWalletOrNew = await getWallet(userId);
    if (existingWalletOrNew.success) {
        let restoredWallet = await new ethers.Wallet(privateKey);

        if (restoredWallet ? restoredWallet.signingKey : null) {
            try {
                let updatedRecord = await Wallet.collection.updateOne(
                    { slackId: userId },
                    {
                        $set: {
                            address: restoredWallet.signingKey.address,
                            privateKey: restoredWallet.signingKey.privateKey
                        }
                    },
                    {
                        upsert: false
                    }
                );
                console.log(updatedRecord.result);
                console.log(restoredWallet.signingKey.address);
                return {
                    message: `Restored wallet!`,
                    success: true,
                    data: {
                        walletRestored: true,
                        address: restoredWallet.address,
                    }
                }
            } catch (e) {
                console.error("Error updating record", e);
                return restoreFailure;
            }
        } else {
            return restoreFailure;
        }
    } else {
        return {
            message: `Failed to restore wallet`,
            success: false,
            data: {
                walletRestored: false
            }
        }
    }
};

module.exports = fromMnemonic;