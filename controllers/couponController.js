const session = require('express-session');
const coupon = require("../models/couponModel")

// To load  coupon view page
// --------------------------------------------------------------
const getCouponListPage = async function (req, res) {
    try {
        const couponData = await coupon.find({})
        res.render('coupons', { message: couponData })
    } catch (error) {
        console.log(error);
    }
}
// --------------------------------------------------------------


// To load  add coupon form
// --------------------------------------------------------------
const getCouponAddPage = async function (req, res) {
    try {
        categoryData = []
        res.render('add-coupons', { categoryData })
    } catch (error) {
        console.log(error);
    }
}
// --------------------------------------------------------------


// To post added coupon to database
// --------------------------------------------------------------
const postAddCoupon = async function (req, res) {
    try {
        const newCoupon = new coupon({
            code: req.body.code,
            discountType: req.body.discountType,
            discountAmount: req.body.discountAmount,
            maxDiscountAmount: req.body.amount,
            maxCartAmount: req.body.cartamount,
            expiryDate: req.body.expirydate,
            maxUsers: req.body.couponcount
        })
        const couponData = await newCoupon.save()

        if (couponData) {
            res.redirect('/admin/coupons')
        } else {
            res.redirect('/admin')
        }
    } catch (error) {
        console.log(error);
    }
}
// --------------------------------------------------------------


// Post Apply coupon
// --------------------------------------------------------------
const applyCoupon = async (req, res) => {
    try {
        const code = req.body.code;
        const amount = Number(req.body.amount);
        const userExist = await coupon.findOne({ code: code, user: { $in: [req.session.user_id] } });
        if (userExist) {
            res.json({ user: true });
        } else {
            const couponData = await coupon.findOne({ code: code });
            console.log(couponData);
            if (couponData) {
                if (couponData.maxUsers <= 0) {
                    res.json({ limit: true });
                } else {
                    if (couponData.status == false) {
                        res.json({ status: true })
                    } else {
                        if (couponData.expiryDate <= new Date()) {
                            res.json({ date: true });
                        } else {
                            if (couponData.maxCartAmount >= amount) {
                                res.json({ cartAmount: true });
                            } else {
                                await coupon.findByIdAndUpdate({ _id: couponData._id }, { $push: { user: req.session.user_id } });
                                await coupon.findByIdAndUpdate({ _id: couponData._id }, { $inc: { maxUsers: -1 } });
                                if (couponData.discountType == "Fixed") {
                                    const disAmount = couponData.discountAmount;
                                    const disTotal = Math.round(amount - disAmount);
                                    return res.json({ amountOkey: true, disAmount, disTotal });
                                } else if (couponData.discountType == "Percentage Type") {
                                    const perAmount = (amount * couponData.discountAmount) / 100;
                                    if (perAmount <= maxDiscountAmount) {
                                        const disAmount = perAmount;
                                        const disTotal = Math.round(amount - disAmount);
                                        return res.json({ amountOkey: true, disAmount, disTotal });
                                    }
                                } else {
                                    const disAmount = couponData.maxDiscountAmount;
                                    const disTotal = Math.round(amount - disAmount);
                                    return res.json({ amountOkey: true, disAmount, disTotal });
                                }
                            }
                        }
                    }
                }
            } else {
                res.json({ invalid: true });
            }
        }

    } catch (error) {
        console.log(error.message);
    }
}
// --------------------------------------------------------------

module.exports = {
    getCouponListPage,
    getCouponAddPage,
    postAddCoupon,
    applyCoupon
}