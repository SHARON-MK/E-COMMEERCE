const express = require('express')
const user_route = express()
const config = require('../config/config')
const userController = require('../controllers/userController')
const cartController = require('../controllers/cartController')
const orderController = require('../controllers/orderController')
const wishlistController = require('../controllers/wishlistController')
const couponController = require('../controllers/couponController')
const session = require('express-session')
const auth = require('../middlewares/auth')

user_route.set('view engine','ejs')
user_route.set('views','./views/users')

user_route.use(session({
    secret:config.sessionSecret,
    saveUninitialized:true,
    resave:false,
    Cookie:{maxAge : 600000},
}))

user_route.use(express.json())
user_route.use(express.urlencoded({extended:true}))


// GET REQUESTS
// -------------------------
// user Controller
user_route.get('/',userController.getHome)
user_route.get('/login',auth.isLogout,userController.getLogin)
user_route.get('/register',auth.isLogout,userController.getRegister)
user_route.get('/user-logout',userController.userLogout)
user_route.get('/otp-page',userController.getOtpPage)
user_route.get('/forget-password',auth.isLogout,userController.getForgetPassword)
user_route.get('/reset-password',auth.isLogout,userController.getResetPassword)
user_route.get('/product',userController.getProductPage)
user_route.get('/resend-otp',userController.resendOtp)
user_route.get('/profile',userController.getProfile)
user_route.get('/myorders',userController.getMyOrders)
user_route.get('/singleorderview',userController.getSingleOrderView)
user_route.get('/shop',auth.isLogin,userController.getShopPage)
// cart Controller
user_route.get('/cart',auth.isLogin,cartController.getCart)
user_route.get('/checkout',auth.isLogin,cartController.getCheckout)
user_route.get('/add-address',auth.isLogin,cartController.getAddAddress)
user_route.get('/removeproduct',auth.isLogin,cartController.removeProduct)


// wishlist Controller
user_route.get('/wishlist',auth.isLogin,wishlistController.getWishlist)
user_route.get('/wishlistitemdelete',auth.isLogin,wishlistController.removeProduct)
// order Controller
user_route.get('/editorder',orderController.editOrder)
user_route.get('/order-place',orderController.orderplaced)

// POST REQUESTS
// -------------------------
// user Controller
user_route.post('/login',userController.postLogin)
user_route.post('/register',userController.postRegister)
user_route.post('/otp-page',userController.verifyOtp)
user_route.post('/forget-password',userController.postForgetPassword)
user_route.post('/reset-password',userController.resetPassword)
// cart Controller
user_route.post('/addToCart',cartController.addToCart)
user_route.post('/add-address',cartController.postAddAddress)

// cart controller for ajx in cart to increase count
user_route.delete('/removeproduct',auth.isLogin,cartController.postremoveProduct)
user_route.patch('/cartqntyincrese',auth.isLogin,cartController.cartQuantityIncrese,cartController.totalproductprice)

// order Controller
user_route.post('/checkout',orderController.placeOrder)
user_route.post('/verifyPayment',orderController.verifyOnlinePayment)
user_route.get('/order-place',orderController.orderplaced)
// wishlist Controller
user_route.post('/addtowhishlist',auth.isLogin,wishlistController.addtowhishlist)
user_route.post('/whishToCart',auth.isLogin,wishlistController.addToCartFromWishlist)
// coupon Controller
user_route.post('/applyCoupon',couponController.applyCoupon)








module.exports = user_route
