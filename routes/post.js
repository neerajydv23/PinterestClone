const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
  user:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"user"
  },
  title:String,
  description:String,
  image:String,
  comments: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
      },
      text: String,
    }
  ],
});


module.exports = mongoose.model("post",postSchema);