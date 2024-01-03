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
  username: String,
  name:String,
  email:String,
  password:String,
  profileImage:String,
  contact:Number,
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