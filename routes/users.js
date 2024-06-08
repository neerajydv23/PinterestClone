const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');

// mongoose.connect("mongodb://127.0.0.1:27017/pin");
const Connection = async ()=>{
  const URL = `mongodb+srv://yneeraj082r:2T03JqcQ8XaXani3@cluster0.uxm0oas.mongodb.net/?retryWrites=true&w=majority`;
  try{
    await mongoose.connect(URL,{useUnifiedTopology:true,useNewUrlParser:true});
    console.log("Database connected succesfully");
  }catch(error){
    console.log("Error",error);
  }
}
Connection();

const userSchema = mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: [true, 'Username is required'],
    trim: true,
    validate: {
      validator: function (value) {
        // Check if the username contains any whitespace
        return !/\s/.test(value);
      },
      message: 'Username must not contain spaces'
    }
  },
   name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email:{
    type : String,
    trim: true,
    lowercase: true,
    unique: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  password:{
    type : String,
    required: [true, 'Password is required'],

  },
  profileImage:String,
  contact: {
    type: String,
    unique: true,
    validate: {
      validator: function (v) {
        return /^([0-9]{10}$)/.test(v);
      }
    },
    required: [true, 'Contact is required'],
    trim: true,
  },
  boards:{
    type:Array,
    default:[]
  },
  posts:[
    {
      type: mongoose.Schema.Types.ObjectId,
      ref:"post"
    }
  ],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  saves:[ 
  {
    type: mongoose.Schema.Types.ObjectId,
    ref:"post"
  }
]
});

userSchema.plugin(plm);

module.exports = mongoose.model("user",userSchema);