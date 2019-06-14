const express = require('express');
const router  = express.Router();
const mongoose = require('mongoose');
const User = require('../models/userModels');
const passport = require('passport');
const Loan = require('../models/loanModels');
const multer = require('multer');
const KYC=require('../models/kycModels')

var storage = multer.diskStorage({
    destination: 'public/userAssets/uploads/',
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now()+ '.jpg')
    }
})

var storageKyc = multer.diskStorage({
    destination: 'public/userAssets/uploads/kyc',
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now()+ '.jpg')
    }
})
var upload = multer({ storage: storage })

var uploadKyc = multer({ storage: storageKyc })


router.get('/new',(req,res)=>{
    res.render('user/newuser')
});




router.post('/flush/:id',(req,res)=>{
    User.findById(req.params.id, (err,user)=>{
        user.wallet -= req.body.trans;
        if(user.wallet >= 0)
            user.save();
    })
    res.redirect('/user/dashboard');
})

router.post('/new',upload.single('file'),(req,res)=>{
  // console.log(req.file);
    var newUser = new User({username: req.body.username, name: req.body.name, email: req.body.email,profilePic: req.file.path});
    User.register(newUser,req.body.password, (err,user)=>{
        if(err){
            console.log(err);
            res.redirect('/')
        }
        passport.authenticate("local")(req,res, ()=>{
        res.redirect(`/user/dashboard`)
        })
    } );

})

router.get ('/kyc',isLoggedIn,(req,res)=>{
    res.render('user/kyc');
})

router.post('/kyc',isLoggedIn,uploadKyc.fields([
    { name:'adhaarImage' ,maxCount:1 },
    { name:'panImage' ,maxCount:1 },
    { name:'salarySlip' ,maxCount:1 }
]),(req,res)=>{
    KYC.create({
        adhaarno:req.body.adhaarno,
        panno: req.body.panno,
        salary: req.body.salary,
        profile: req.body.profile,
        adhaarImage: req.files.adhaarImage.path,
        panImage: req.files.panImage.path,
        salarySlip: req.files.salarySlip.path
    },(err,kyc)=>{

        User.findById(req.user._id,(err,user)=>{
            user.kyc=kyc._id;
            user.save();
            res.redirect('/user/dashboard');
        })        
        
    })
});


router.get('/dashboard',isLoggedIn,(req,res)=>{
    
    User.findById(req.user._id,(err,user)=>{
        if(err){
            console.log(err);
        }else{
           // console.log(user.profilePic.substring(6));
            Loan.find({recepient: req.user._id, status: 'pending'},(err,pendingLoans)=>{
               // console.log(pendingLoans);
                if(err){
                    console.log(err);
                }else{
                    Loan.find({recepient: req.user._id, status: 'accepted'},(err,acceptedLoans)=>{

                        if(err){
                            console.log(err);
                        }else{
                            Loan.find({"collablender._id": req.user._id},(err,collabLoans)=>{
                                if(err){
                                    console.log(err);
                                }else{
                                    res.render('user/dashboard/dashboard',{user:user, collabLoans:collabLoans , acceptedLoans:acceptedLoans , pendingLoans:pendingLoans});
                                }
                            })
                        }

                    })
                }

            })

          //  res.render('user/dashboard/dashboard',{user:user});
        }
    })
})

router.get('/login',(req,res)=>{
    res.render('user/login')
});


router.post('/login',passport.authenticate("local",{
    successRedirect: "/user/dashboard",
    failureRedirect: "/user/login"
}),(req,res)=>{
    
});

router.get('/logout',(req,res)=>{
    req.logOut();
    res.redirect('/');
})

function isLoggedIn(req,res,next){
    // console.log(req.isAuthenticated());
     if(req.isAuthenticated()){
         return next();
     }
     res.redirect('/user/login');
 }
 
module.exports = router;