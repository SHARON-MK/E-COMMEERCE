const users = require('../models/userModel')
const category = require('../models/categoryModel')
const order = require('../models/orderModel')
const productModel = require('../models/productModel')


const session = require('express-session')
const bcrypt = require('bcrypt')
const { ClientSession } = require('mongodb')




// GET ADMIN PANEL - get /admin
// ---------------------------------------------------------------------------------
const getAdminPanel = async (req, res) => {
    try {
        const total = await order.aggregate([
            {
              $match: {
                status: { $nin: ["cancelled", "returned"] } // Exclude "cancelled" and "returned" statuses
              }
            },
            {
              $group: {
                _id: null,
                total: { $sum: "$paid" }
              }
            }
          ]);
          
        const user_count = await users.find({is_admin:0}).count();
        const order_count = await order.find({}).count();
        const product_count = await productModel.find({}).count();

        const payment = await order.aggregate([{$group:{_id:"$paymentMethod",totalPayment:{$count:{}}}}])

        let sales = [];
            var date = new Date();
            var year = date.getFullYear();
            var currentyear = new Date(year, 0, 1);
            let salesByYear = await order.aggregate([
                {
                  $match: {
                    createdAt: { $gte: currentyear },
                    status: { $nin: ["cancelled", "returned"] } // Exclude "cancelled" and "returned" statuses
                  }
                },
                {
                  $group: {
                    _id: { $dateToString: { format: "%m", date: "$createdAt" } },
                    total: { $sum: "$paid" }
                  }
                },
                { $sort: { _id: 1 } }
              ]);
              
            for(let i=1;i<=12;i++){
                let result = true;
                for(let k=0;k<salesByYear.length;k++){
                    result = false;
                    if(salesByYear[k]._id==i){
                        sales.push(salesByYear[k])
                        break;
                    }else{
                        result = true
                    }
                }
                if(result) sales.push({_id:i,total:0});
            }
            let salesData = [];
            for(let i=0;i<sales.length;i++){
                salesData.push(sales[i].total);
            }
            console.log(salesData);
       
        res.render('admin-panel',{total,user_count,order_count,product_count,payment,month:salesData})
    } catch (error) {
        console.log(error)
    }
}
// ---------------------------------------------------------------------------------



// GET LOGIN  - get /admin/login
// ---------------------------------------------------------------------------------
const getLogin = async (req, res) => {
    try {

        res.render('login')
    } catch (error) {
        console.log(error)
    }
}
// ---------------------------------------------------------------------------------




// POST LOGIN    - To verify Admin credentials
// ---------------------------------------------------------------------------------
const postLogin = async (req, res) => {
    try {
        const emailEntered = req.body.email
        const passwordEntered = req.body.password
        const adminDb = await users.findOne({ email: emailEntered })

        if (adminDb) {
            const matchPassword = await bcrypt.compare(passwordEntered, adminDb.password)
            if (matchPassword) {
                if (adminDb.is_admin === 0) {
                    res.render('login', { message: 'You are not ADMIN' })
                }
                else {
                    req.session.admin_id = adminDb._id
                    res.redirect('/admin')
                }
            }
            else {
                res.render('login', { message: 'Entered password is wrong' })
            }
        }
        else {
            res.render('login', { message: 'Entered email ID is wrong' })
        }
    } catch (error) {
        console.log(error.message);
    }
}
// ---------------------------------------------------------------------------------



// GET LOGOUT - session destroy
// ---------------------------------------------------------------------------------
const getLogout = async (req, res) => {
    try {
        req.session.destroy()
        res.redirect('/admin/login')
    } catch (error) {
        console.log(error)
    }
}
// ---------------------------------------------------------------------------------




// GET USER MANAGEMENT - /admin/users
// ---------------------------------------------------------------------------------
const getUserManagement = async (req, res) => {
    try {
        const userDatas = await users.find({ $and: [{ is_verified: 1 }, { is_admin: 0 }] })
        res.render('users', { message: userDatas })
    } catch (error) {
        console.log(error)
    }
}
// ---------------------------------------------------------------------------------




// TO BLOCK USER - /admin/users/block
// ---------------------------------------------------------------------------------
const blockUser = async (req, res) => {
    try {
        const id = req.query.id
        await users.updateOne({ _id: id }, { $set: { is_block: 1 } })
        res.redirect('/admin/users')
    } catch (error) {
        console.log(error)
    }
}
// ---------------------------------------------------------------------------------




// TO un BLOCK USER - /admin/users/block
// ---------------------------------------------------------------------------------
const unBlockUser = async (req, res) => {
    try {
        const id = req.query.id
        await users.updateOne({ _id: id }, { $set: { is_block: 0 } })
        res.redirect('/admin/users')
    } catch (error) {
        console.log(error)
    }
}
// ---------------------------------------------------------------------------------



// GET CATEGORY PAGE - /admin/categories
// ---------------------------------------------------------------------------------
const getCategory = async (req, res) => {
    try {
        const categoryDatas = await category.find()
        res.render('category', { message: categoryDatas })
    } catch (error) {
        console.log(error)
    }
}
// ---------------------------------------------------------------------------------



// GET ADD CATEGORY PAGE - /admin/categories/add
// ---------------------------------------------------------------------------------
const getAddCategoryPage = async (req, res) => {
    try {
        res.render('add-category')
    } catch (error) {
        console.log(error)
    }
}
// ---------------------------------------------------------------------------------



// POST - ADD CATEGORY TO DB 
// ---------------------------------------------------------------------------------
const addCategory = async (req, res) => {
    try {
        const newCategory = req.body.category
        if (newCategory.trim().length == 0) {
            res.render('add-category', { message: 'Enter category name' })
        }
        const categoryExists = await category.findOne({ name: new RegExp('^' + newCategory + '$', 'i') })

        if (categoryExists) {
            res.render('add-category', { message: 'Category already registered' })
        }
        else {
            const categoryData = new category({
                name: req.body.category,
                is_block: 0
            })
            const categoryDoc = await categoryData.save()
            res.redirect('/admin/category')
        }
    }
    catch (error) {
        console.log(error.message);
    }
}
// ---------------------------------------------------------------------------------



// TO BLOCK A CATEGORY 
// ---------------------------------------------------------------------------------
const blockCategory = async (req, res) => {
    try {
        const id = req.query.id
        await category.updateOne({ _id: id }, { $set: { is_block: 1 } })
        res.redirect('/admin/category')
    } catch (error) {
        console.log(error)
    }
}
// ---------------------------------------------------------------------------------



// TO UN BLOCK A CATEGORY
// ---------------------------------------------------------------------------------
const unBlockCategory = async (req, res) => {
    try {
        const id = req.query.id
        await category.updateOne({ _id: id }, { $set: { is_block: 0 } })
        res.redirect('/admin/category')
    } catch (error) {
        console.log(error)
    }
}
// ---------------------------------------------------------------------------------


// get ORDERS
// ---------------------------------------------------------------------------------
const getOrders = async (req, res) => {
    try {
        const orders = await order.find({})
        res.render('order', { message: orders })
    } catch (error) {
        console.log(error)
    }
}
// ---------------------------------------------------------------------------------


// edit ORDERS
// ---------------------------------------------------------------------------------
const editOrder = async (req, res) => {
    try {
        const id = req.query.id
        const orderData = await order.findById({ _id: id })
        const totalBillAmount = orderData.totalAmount

        if (orderData.status === 'placed') {
            await order.updateOne({ _id: id }, { $set: { status: 'delivered' } })
            res.redirect('/admin/orders')
        }


        if (orderData.status === 'req-for-cancellation') {

            const walletAmountUsed = orderData.wallet
            const userid = req.session.user_id
            const userData = await users.findById({ _id: userid })

            const newWallet = parseInt(userData.wallet + walletAmountUsed)
            if (orderData.paymentMethod === 'COD') {
                await users.findByIdAndUpdate({ _id: userid }, { $set: { wallet: newWallet } })
            } else {
                await users.findByIdAndUpdate({ _id: userid }, { $set: { wallet: totalBillAmount } })
            }
            await order.updateOne({ _id: id }, { $set: { status: 'cancelled' } })

            // to increase the stock
            const product = orderData.product
            for (let i = 0; i < product.length; i++) {
                const productId = product[i].productId
                const productData = await productModel.findById({_id: productId})
                if(productData.stock === 0){
                    await productModel.findByIdAndUpdate(productId, { $set: { status: 'In Stock' } })
                }
                const quantity = product[i].count
                await productModel.findByIdAndUpdate(productId, { $inc: { stock: +quantity } })
            }
            // -----

            res.redirect('/admin/orders')
        }

        if (orderData.status === 'req-for-return') {


            const userid = req.session.user_id
            await users.findByIdAndUpdate({ _id: userid }, { $set: { wallet: totalBillAmount } })

            await order.updateOne({ _id: id }, { $set: { status: 'returned' } })

            // to increase the stock
            const product = orderData.product
            for (let i = 0; i < product.length; i++) {
                const productId = product[i].productId
                const productData = await productModel.findById({_id: productId})
                if(productData.stock === 0){
                    await productModel.findByIdAndUpdate(productId, { $set: { status: 'In Stock' } })
                }
                const quantity = product[i].count
                await productModel.findByIdAndUpdate(productId, { $inc: { stock: +quantity } })
                
            }
            // -----
            res.redirect('/admin/orders')
        }

    } catch (error) {
        console.log(error)
    }
}
// ---------------------------------------------------------------------------------





module.exports = {
    getAdminPanel,
    getLogin,
    postLogin,
    getLogout,
    getUserManagement,
    unBlockUser,
    getCategory,
    getAddCategoryPage,
    addCategory,
    blockCategory,
    unBlockCategory,
    blockUser,
    getOrders,
    editOrder
}