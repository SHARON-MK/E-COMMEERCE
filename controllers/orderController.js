const { createRequire } = require('module')
const { log } = require('console')
const session = require('express-session')

const User = require('../models/userModel')
const order = require('../models/orderModel');
const cart = require('../models/cartModel');
const productModel = require('../models/productModel');
const Razorpay = require('razorpay')

let dontenv = require('dotenv')
dontenv.config()

var instance = new Razorpay({
    key_id: process.env.razorpayId,
    key_secret: process.env.razorpayKey
});


//place the order
// -------------------------
const placeOrder = async (req, res) => {
    try {
        console.log('hai');

        const userData = await User.findOne({ _id: req.session.user_id });
        const session = req.session.user_id
        const total = await cart.aggregate([{ $match: { userId: userData._id } }, { $unwind: "$products" }, { $project: { productPrice: "$products.productPrice", count: "$products.count" } }, { $group: { _id: null, total: { $sum: { $multiply: ["$productPrice", "$count"] } } } }]);
        // let Total = req.body.amount

        let discountAmount = req.body.discountAmount
        console.log('discntamnt' + discountAmount);

        const TotalInitially = total.length > 0 ? total[0].total : 0;
        const Total = TotalInitially - discountAmount
        console.log('total' + Total);

        const userWalletAmount = userData.wallet
        console.log('wall-amnt' + userWalletAmount);

        let paidAmount;
        let walletAmountUsed
        let walletAmountBalance

        if (userWalletAmount < Total) {
            paidAmount = req.body.amount
            walletAmountUsed = TotalInitially - paidAmount - discountAmount
            walletAmountBalance = userWalletAmount - walletAmountUsed
        } else {
            paidAmount = 0
            walletAmountUsed = Total
            walletAmountBalance = userWalletAmount - Total
        }

        await User.findOneAndUpdate({ _id: req.session.user_id }, { $set: { wallet: walletAmountBalance } })

        let payment = req.body.payment;
        let address = req.body.address

        if (payment === undefined) {
            payment = 'wallet'
        }


        const cartData = await cart.findOne({ userId: req.session.user_id });

        const products = cartData.products;

        if (payment != "online") {
            status = "placed"
        } else {
            status = "pending"
        }
        // const status = payment === "COD" ? "placed" : "pending";

        const newOrder = new order({
            deliveryDetails: address,
            user: userData.name,
            userId: userData._id,
            paymentMethod: payment,
            paid: paidAmount,
            wallet: walletAmountUsed,
            product: products,
            totalAmount: Total,
            date: Date.now(),
            status: status
        });

        const saveOrder = await newOrder.save();
        const orderId = newOrder._id;
    
        // to reduce the stock
        const orderData = await order.findById({ _id: orderId })
        const product = orderData.product
        for (let i = 0; i < product.length; i++) {
            const productId = product[i].productId
            const quantity = product[i].count
            await productModel.findByIdAndUpdate(productId, { $inc: { stock: -quantity } })
            const productData = await productModel.findById({_id: productId})
            if(productData.stock === 0){
                await productModel.findByIdAndUpdate(productId, { $set: { status: 'Out Of Stock' } })
            }
        }
        // -----



        if (status === "placed") {
            await cart.deleteOne({ userId: userData._id });

            res.json({ success: true })

        } else {

            const orderid = saveOrder._id

            const totalamount = saveOrder.paid

            var options = {
                amount: totalamount * 100,
                currency: "INR",
                receipt: "" + orderid
            }
            instance.orders.create(options, function (err, order) {
                res.json({ order });
            })
        }
    } catch (error) {
        console.log(error.message);
    }
}



// verify online payment
const verifyOnlinePayment = async (req, res) => {
    try {


        // const totalPrice = req.body.amount2;
        // const total = req.body.amount;
        // const wal = totalPrice - total;
        const details = (req.body)

        const crypto = require('crypto');
        let hmac = crypto.createHmac('sha256', process.env.razorpayKey);
        hmac.update(details.payment.razorpay_order_id + '|' + details.payment.razorpay_payment_id)

        hmac = hmac.digest('hex');


        console.log(details.payment.razorpay_signature);

        if (hmac == details.payment.razorpay_signature) {

            await order.findByIdAndUpdate({ _id: details.order.receipt }, { $set: { status: "placed" } });
            await order.findByIdAndUpdate({ _id: details.order.receipt }, { $set: { paymentId: details.payment.razorpay_payment_id } });
            await cart.deleteOne({ userId: req.session.user_id });
            res.json({ success: true });
        } else {
            await order.findByIdAndRemove({ _id: details.order.receipt });
            res.json({ success: false });
        }


    } catch (error) {
        console.log(error.message);

    }
}

// succes page
const orderplaced = async (req, res) => {
    try {
        const userData = await User.findOne({ email: req.session.user_id })
        const session = req.session.email

        res.render('success', { session, userData })

    } catch (error) {
        console.log(error.message);

    }
}


// edit the status of order
const editOrder = async (req, res) => {
    try {
        const id = req.query.id
        const orderData = await order.findById({ _id: id })


        if (orderData.status === 'placed') {
            await order.updateOne({ _id: id }, { $set: { status: 'req-for-cancellation' } })
            res.redirect('/myorders')
        }

        if (orderData.status === 'delivered') {
            await order.updateOne({ _id: id }, { $set: { status: 'req-for-return' } })
            res.redirect('/myorders')
        }




    } catch (error) {
        console.log(error.message);
    }
}


module.exports = { placeOrder, editOrder, verifyOnlinePayment, orderplaced }