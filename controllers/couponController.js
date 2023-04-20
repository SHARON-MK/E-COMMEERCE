const session = require('express-session');

// To load  add address Table
// --------------------------------------------------------------
const getCouponListPage = async function (req, res) {
    try {
        a=[]
        res.render('coupons',{message:a})
    } catch (error) {
        console.log(error);
    }
}
// --------------------------------------------------------------


// To load  add address Table
// --------------------------------------------------------------
const getCouponAddPage = async function (req, res) {
    try {
        categoryData=[]
        res.render('add-coupons',{categoryData})
    } catch (error) {
        console.log(error);
    }
}
// --------------------------------------------------------------


module.exports={ 
    getCouponListPage,
    getCouponAddPage
}