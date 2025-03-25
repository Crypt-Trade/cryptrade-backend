const mongoose = require('mongoose');
const bcrypt = require('bcrypt');


const userSchema = new mongoose.Schema({
  sponsorId: {
    type: String,
    required: true,
  },
  name: {
    type: String, // Preferred Customer Name
    required: true,
  },
  mobileNumber: {
    type: String, // Mobile Number
    required: true,
  },
  email: {
    type: String, // Email ID
    required: true,
    unique: true,
  },
  password: {
    type: String, // Password
    required: true
  },
  // ---------------------------------------------------------------------------------------------------------------------
  parentSponsorId: {
    type: String,
    default: null,
  },
  mySponsorId: {
    type: String,
    required: true,
  },
  leftRefferalLink: {
    type: String,
    required: true,
  },
  rightRefferalLink: {
    type: String,
    required: true,
  },
  binaryPosition: {
    left: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Binary positions refer to other users
    },
    right: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Binary positions refer to other users
    }
  },
  bvPoints: {
    type: Number,
    default: 0,
  },
  // ---------------------------------------------------------------------------------------------
  isActive: {
    type: Boolean,
    default: false,
  },
  activeDate: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  uniqueKey: {
    type: String,
    unique: true, // Ensure uniqueness
    required: true,
  }
});




userSchema.pre('save', async function(next) {
    const user = this;
    if(!user.isModified('password')) next();

    try{
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        user.password = hashedPassword;
        next();
    }catch(err){
        console.log('Error: '+ err);
        next(err);
    }
});




userSchema.methods.comparePassword = async function(candidatePassword){
    try{
        const isMatch = await bcrypt.compare(candidatePassword, this.password);
        return isMatch;
    }catch(err){
        throw err;
    }
};



const User = mongoose.model('User', userSchema);
module.exports = User;