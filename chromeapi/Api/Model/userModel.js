const mongoose=require("mongoose");
const bcrypt =require("bcryptjs");

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,"Please tell us your name!"],
    },
    email:{
        type:String,
        required:[true,"Please provide your email"],
        unique:true,
        lowercase:true
    },
    password:{
        type:String,
        required:[true,"Please provide a password"],
    },
    passwordConfirm:{
        type:String,
        required:[true,"Please confirm your password"],
        validate:{
            validator:function(el){
                return el===this.password
            },
            message:"Passwords are not the same"
        },
    },
    // The relation between User entity and Account entity is possible via private_key field
    private_key: String,
    address:String,
    mnemonic: String,
});

userSchema.pre("save",async function (next){
    if(!this.isModified("password")){ 
        //If the request doesn't modify the password, skip this function
        return next();
    } 
    this.password=await bcrypt.hash(this.password,12);
    this.passwordConfirm=undefined;
    next();
});

userSchema.pre("save", function(next){
    if(!this.isModified("password") || this.isNew){ 
        // If the request doesn't modify the password, or, 
        // If the request is a newUser request, skip this function 
        return next();
    } 
    this.passwordChangedAt=Date.now()-1000;
    next();
});

userSchema.pre(/^find/,function(next){
    this.find({active:{$ne:false}});
    next();
});

userSchema.methods.correctPassword=async function(
    candidatePassword,
    userPassword
){
    return await bcrypt.compare(candidatePassword,userPassword)
};

userSchema.methods.changedPasswordAfter=function(JWTTimestamp){
    if(this.passwordChangedAt){
        const changedTimestamp=parseInt(
            this.passwordChangedAt.getTime()/1000,
            10
        );
        return JWTTimestamp<changedTimestamp;
    }
    return false;
}

const User=mongoose.model("User",userSchema);

module.exports=User;
