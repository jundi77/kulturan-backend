function buy(req, res) {
    // testing mode
    let parameter = {
        transaction_details: {
            order_id: `test-transaction-${Date.now()}`,
            gross_amount: 1000000,
        },
        creditCard: {
            secure: true,
        },
    };
    global.kulturan.midtrans.snap
        .createTransaction(parameter)
        .then((transaction) => {
            console.log(transaction);
            return res.status(200).json({
                status: 'success',
                data: {
                    transactionToken: transaction.token,
                    redirectURL: transaction.redirect_url,
                },
            });
        })
        .catch((err) => {
            console.error(err);
            return res.status(400).json({
                status: 'failed',
                msg: 'DB ERROR',
            });
        });
}
function getStruct(req, res) {
    return res.status(400).json({
        status: 'failed',
        msg: 'OND',
    });
}
function midtransReceiver(req, res) {
    return res.status(400).json({
        status: 'failed',
        msg: 'OND',
    });
}

module.exports = {
    buy,
    getStruct,
    midtransReceiver,
};
