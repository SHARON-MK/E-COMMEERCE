const express = require('express')
const admin_route = express()
const config = require('../config/config')
const adminController = require('../controllers/adminController')
const productsController = require('../controllers//productController')
const couponController = require('../controllers/couponController')
const session = require('express-session')
const auth = require('../middlewares/authAdmin')

admin_route.set('view engine','ejs')
admin_route.set('views','./views/admin')

admin_route.use(session({
    secret:config.sessionSecret,
    saveUninitialized:true,
    resave:false,
    Cookie:{maxAge : 120000},
}))

const path = require('path')
const multer = require('multer')

const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,path.join(__dirname,'../public/admin/productimages'))
    },
    filename:function(req,file,cb){
        const name = Date.now()+'-'+file.originalname
        cb(null,name)
    }
})

const upload = multer({storage:storage})


admin_route.use(express.json())
admin_route.use(express.urlencoded({extended:true}))


// GET REQUESTS
admin_route.get('/',auth.isLogin,adminController.getAdminPanel)
admin_route.get('/login',auth.isLogout,adminController.getLogin)
admin_route.get('/logout',auth.isLogin,adminController.getLogout)
admin_route.get('/users',auth.isLogin,adminController.getUserManagement)
admin_route.get('/users/block',auth.isLogin,adminController.blockUser)
admin_route.get('/users/unblock',auth.isLogin,adminController.unBlockUser)
admin_route.get('/category',auth.isLogin,adminController.getCategory)
admin_route.get('/category/add',auth.isLogin,adminController.getAddCategoryPage)
admin_route.get('/category/block',auth.isLogin,adminController.blockCategory)
admin_route.get('/category/unblock',auth.isLogin,adminController.unBlockCategory)
admin_route.get('/orders',auth.isLogin,adminController.getOrders)
admin_route.get('/editorder',adminController.editOrder)


admin_route.get('/products',auth.isLogin,productsController.getProducts)
admin_route.get('/products/add',auth.isLogin,productsController.getAddProducts)
admin_route.get('/products/delete',auth.isLogin,productsController.deleteProduct)
admin_route.get('/products/edit',auth.isLogin,productsController.editProduct)

// coupon controller
admin_route.get('/coupons',couponController.getCouponListPage)
admin_route.get('/coupons/add',couponController.getCouponAddPage)
admin_route.get('/coupons/delete',couponController.deleteCoupon)
admin_route.get('/coupons/edit',couponController.editCoupon)






// POST REQUESTS
admin_route.post('/login',adminController.postLogin)
admin_route.post('/category/add',adminController.addCategory)

admin_route.post('/products/add',upload.array('image'),productsController.addProduct)
admin_route.post('/products/edit',upload.array('image'),productsController.postEditProduct)
admin_route.post('/delete_image',productsController.deleteImage)

// coupon controller
admin_route.post('/coupons/add',couponController.postAddCoupon)
admin_route.post('/coupons/edit',couponController.postEditCoupon)



module.exports = admin_route