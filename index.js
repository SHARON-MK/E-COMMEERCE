const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO)
// const path = require('path')

const express = require('express')
const app = express()

app.use(express.static('public/users'))
app.use(express.static('public/admin'))

// app.use(express.static(path.join(__dirname,"public")))

app.use((req, res, next) => {
    res.header(
      "Cache-Control",
      "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
    );
    next();
  });


const userRoute = require('./routes/userRoute')
app.use('/',userRoute)

const adminRoute = require('./routes/adminRoute')
app.use('/admin',adminRoute)


app.listen(3000,()=>console.log("server started running"))