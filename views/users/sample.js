                <%products.forEach((products)=>{%>
                  <div class="row mb-4 d-flex justify-content-between align-items-center">
                    <div class="col-md-2 col-lg-2 col-xl-2">
                      <img
                        src="/admin/productImage/<%=products.productId.image[1]%>"
                        class="img-fluid rounded-3" alt="Cotton T-shirt">
                    </div>
                   
                    <div class="col-md-3 col-lg-3 col-xl-3">
                    
                      <h6 class="text-muted"><%=products.name%></h6>
                      <h6 class="text-black mb-0"><%=products.price%></h6>
                    
                    </div>
                   
              
                 
                 
                 
                    <div class="col-md-3 col-lg-3 col-xl-2 d-flex">
                      <!-- <button class="btn btn-link px-2"
                        onclick="this.parentNode.querySelector('input[type=number]').stepDown()">
                        <i class="fas fa-minus"></i>
                      </button> -->
                      <!-- <button class="btn btn-sm btn-danger">-</button>
                      <input id="form" min="0" name="quantity"  type="number"
                        class="form-control form-control-sm" / style="width: 3em;">
                        <button class="btn btn-sm btn-success" >+</button> -->

                      <!-- <button class="btn btn-link px-2"
                        onclick="this.parentNode.querySelector('input[type=number]').stepUp()">
                        <i class="fas fa-plus"></i>
                      </button> -->
                    </div>
                    <div class="col-md-3 col-lg-2 col-xl-2 offset-lg-1">
                      <h6 class="mb-0"><a href="/removewish?id=<%=session%>&&prId=<%=products.productId._id%>"><button class="btn btn-sm btn-danger m-2">Remove</button></a></h6>
                    </div>
                     <h6 class="mb-0"><button class="btn btn-sm btn-success m-2" onclick="whishToCart('<%=products.productId._id%>')">AddCart</button></h6>

                    
                   
                  </div>
                  <%})%>
             

<script>
  function whishToCart(id){
    console.log(id)
         $.ajax({
            url:'/whishToCart',
            method:'post',
            data:{
               id:id
            },
            success:(response)=>{
                   if(response.success){         
                       location.href="/cart"
                   }
               }
   
         })
      }
</script>





const addTowish=async(req,res)=>{
    try {
        const productid=req.body.id
        const productData=await productschema.findOne({_id:productid})
        const userData=await user.findOne({_id:req.session.userId})
        if(req.session.userId){
            const userid=req.session.userId;
            const cartData=await cartSchema.findOne({userId:userid})
            if(cartData){
                const productExist= await cartData.products.findIndex((product)=>product.productId==productid)
                if(productExist != -1){
                    await whishListSchema.updateOne({user:req.session.userId},{$pull:{product:{productId:productid}}})                   
                    res.json({success:true})
                }else{
                    await cartSchema.findOneAndUpdate({userId:req.session.userId},{$push:{products:{productId:productid,productPrice:productData.price}}})
                    await whishListSchema.updateOne({user:req.session.userId},{$pull:{product:{productId:productid}}})                   
                     res.json({success:true})
                }
            }else{
                const productData= await whishListSchema.updateOne({user:req.session.userId},{$pull:{product:{productId:productid}}})
              const cart= new cartSchema({
                    userId:userData._id,
                    user:userData.name,
                    products:[{
                        productId:productid,
                        productPrice:productData.price
                    }]
                })
                const cartDatas=await cart.save()
                if(cartDatas){
                    
                    res.json({success:true})
                }else{
                    res.redirect('/whishlist')
                }
            }
        }else{
            res.redirect('/login')
        }
    } catch (error){
        console.log(error.message);
       
    }
}

 









