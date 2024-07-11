const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required : [true ,'please tell your name']
    },
    email:{
        type:String,
        required : [true , 'enter a valid email address'],
        unique:true,
        lowercase:true,
        validate:[validator.isEmail,'Please provide a valid email']
    },
    photo :String,
    password : {
        type:String,
        required:[true,'please provide a valid password'],
        minlength:8
    },
    passwordConfirm : {
        type: String,
        required: [true, 'Please confirm your password'],
        validator: function(el) {
            //this only works on save or create
            //to effectively utilize it we will use save to update the user not 
            // find one and updateOne or updateMany because these directly update the database 
            // records without loading the entire records into memory Because they bypass Mongoose’s field-level tracking, isModified() won’t work as expected with them.
            // When you use set to modify a field, Mongoose keeps track of changes at the field level.
            return el === this.password;
        },
        message: 'Passwords are not the same!' 
    }
   
});
//we should never ever save direct passwords in the database so we will use mongoose middleware 
//to avoid it .
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        // Hash password with strength of 12
        //this hash function takes three inputs 
        //The password string (up to 72 bytes).
        //A numeric cost (usually denoted as a logarithmic factor, e.g., 12).
        //A random 16-byte salt value.
        // a salt is an additional piece of random data that is combined with the password before hashing. 
        this.password = await bcrypt.hash(this.password, 12);
        this.passwordConfirm =undefined ;
        //power of salting is that even two users having same password will not generate same string after hashing.
        //Modern password hashing libraries (like bcrypt) automatically handle salting.
    }
    
    next();
});
const User = mongoose.model('User',userSchema);

module.exports=User;