const { createRequire } = require('module')
const { log } = require('console')
const session = require('express-session')

const User = require('../models/userModel')
const order = require('../models/orderModel');
const cart = require('../models/cartModel');
const Razorpay = require('razorpay')

var instance = new Razorpay({
    key_id: "rzp_test_jrrHKb6Ek3iFiJ",
    key_secret: "1NX6E6KMHG8qrUzyU3jdETtD"
});


//place the order
// -------------------------
const placeOrder = async (req, res) => {
    try {
       
        const userData = await User.findOne({ _id: req.session.user_id });
        const session = req.session.user_id
        const total = await cart.aggregate([{ $match: { userId: userData._id } }, { $unwind: "$products" }, { $project: { productPrice: "$products.productPrice", count: "$products.count" } }, { $group: { _id: null, total: { $sum: { $multiply: ["$productPrice", "$count"] } } } }]);


        const Total = total.length > 0 ? total[0].total : 0;
        const userWalletAmount = userData.wallet

        let paidAmount;
        let walletAmountUsed
        let walletAmountBalance


        if (userWalletAmount < Total) {
            paidAmount = Total - userWalletAmount
            walletAmountUsed = Total - paidAmount
            walletAmountBalance = userWalletAmount - walletAmountUsed
        } else {
            paidAmount = 0
            walletAmountUsed = Total
            walletAmountBalance = userWalletAmount - Total
        }

        await User.findOneAndUpdate({ _id: req.session.user_id }, { $set: { wallet: walletAmountBalance } })

        const payment = req.body.payment;
        const address = req.body.address


        const cartData = await cart.findOne({ userId: req.session.user_id });

        const products = cartData.products;

        if(payment != "online"){
            status = "placed"
        }else{
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
            })}
    } catch (error) {
        console.log(error.message);
    }
}

// verify online payment
const verifyOnlinePayment =async(req,res)=>{
    try {
        
  
        // const totalPrice = req.body.amount2;
        // const total = req.body.amount;
        // const wal = totalPrice - total;
        const details= (req.body)
       
        const crypto = require('crypto');
        let hmac = crypto.createHmac('sha256', '1NX6E6KMHG8qrUzyU3jdETtD');
        hmac.update(details.payment.razorpay_order_id + '|' + details.payment.razorpay_payment_id)  
            
        hmac = hmac.digest('hex');
        
  
        console.log(details.payment.razorpay_signature);
        
        if (hmac == details.payment.razorpay_signature) {

            await order.findByIdAndUpdate({_id:details.order.receipt},{$set:{status:"placed"}});
            await order.findByIdAndUpdate({_id:details.order.receipt},{$set:{paymentId:details.payment.razorpay_payment_id}});
            await cart.deleteOne({userId:req.session.user_id});
            res.json({success:true});
        }else{
            await order.findByIdAndRemove({_id:details.order.receipt});
            res.json({success:false});
        }
        
  
    } catch (error) {
        console.log(error.message);
        
    }
  }

// succes page
const orderplaced =async (req,res)=>{
    try {
  
        const userData=await User.findOne({email:req.session.user_id})
        const session=req.session.email
  
        res.render('success',{session,userData})    
        
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


module.exports = { placeOrder, editOrder,verifyOnlinePayment,orderplaced }