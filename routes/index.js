var express = require('express');
var router = express.Router();
var userModel = require('./users');
var postModel = require('./post');
const passport = require('passport');
const localStrategy = require('passport-local');
const upload = require('./multer');

passport.use(new localStrategy(userModel.authenticate()))


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { nav:false,error: req.flash('error') });
});

router.get('/register', function(req, res, next) {
  res.render('register', { nav:false ,error: req.flash('error')});
});

router.get('/profile', isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({username:req.session.passport.user}).populate("posts");
  res.render('profile',{user,nav:false});
});

router.get('/edit', async (req, res) => {
  const user = await userModel.findOne({username:req.session.passport.user});
  res.render('edit', { user});
});

router.post('/edit', async (req, res) => {
  const user = await userModel.findOneAndUpdate (
    {username:req.session.passport.user},
    {username: req.body.username, name:req.body.name},
    {new:true}
  );
     await user.save();
  res.redirect('/profile');
});

router.get('/show/posts', isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({username:req.session.passport.user}).populate("posts");
  res.render('show',{user,nav:false});
});

router.get('/feed', isLoggedIn, async function(req,res,next){
  const user = await userModel.findOne({username:req.session.passport.user});
  const posts = await postModel.find().populate("user");
  
  res.render("feed",{user,posts,nav:false});
})

router.get('/post/:postId', async (req, res) => {
  const postId = req.params.postId;
  const post = await postModel.findOne({_id:postId}).populate('user');

  // Render the post-detail.ejs template
  res.render('post-detail', { post });
});

router.get('/add', isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({username:req.session.passport.user});
  res.render('add',{user,nav:false});
});

router.post('/createpost', isLoggedIn, upload.single("postimage"), async function(req, res, next) {
  const user = await userModel.findOne({username:req.session.passport.user});
  const post = await postModel.create({
    user:user._id,
    title:req.body.title,
    description:req.body.description,
    image:req.file.filename
  })
  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile");
});

router.post('/fileupload', isLoggedIn, upload.single("image"), async function(req,res,next){
  const user = await userModel.findOne({username:req.session.passport.user});
  user.profileImage = req.file.filename;
  await user.save();
  res.redirect("/profile");
});

router.post('/register', function(req, res, next) {

  if (!req.body.username || !req.body.fullname || !req.body.email || !req.body.password) {
    req.flash('error', 'All fields are required');
    return res.redirect('/register');
  }

  const data = new userModel({
    username:req.body.username,
    email:req.body.email,
    contact:req.body.contact,
    name:req.body.fullname
  })
  userModel.register(data,req.body.password)
  .then(function(){
    passport.authenticate("local")(req,res,function(){
      res.redirect("/profile");
    })
  })
  .catch(function (err) {
    // Handle registration failure (e.g., username/email already taken)
    req.flash('error', 'Registration failed. Please choose a different username or email.');
    res.redirect('/');
  });
});

router.post('/login', passport.authenticate("local",{
  failureRedirect:"/",
  successRedirect:"/profile",
  failureFlash:true
}),function(req,res,next){
});

router.get('/logout',function(req,res,next){
  req.logout(function(err){
    if(err){return next(err);}
    res.redirect('/');
  });
})

function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect('/');
}

router.get('/search', isLoggedIn, async function(req,res){
  const user = await userModel.findOne({username:req.session.passport.user}).populate("posts");
  res.render('search', { nav:false,user });
})

router.get('/username/:username', isLoggedIn, async function(req, res) {
  const regex = new RegExp(`^${req.params.username}`,'i');
  const users = await userModel.find({username:regex});
  res.json(users);
});

router.get('/profile/:username', isLoggedIn, async function(req,res){
  const followerUser = await userModel.findOne({username:req.params.username}).populate("posts");
  const user = await userModel.findOne({username:req.session.passport.user}).populate("posts");
  res.render("othersProfile",{user,followerUser,footer: true});
})

// Code for follow unfollow route 
router.get('/follow/:username', isLoggedIn, async function(req, res) {
  try {
    const currentUser = await userModel.findOne({ username: req.session.passport.user });
    const otherUser = await userModel.findOne({ username: req.params.username });

    // Check if the current user is already following the other user
    const isFollowing = currentUser.following.includes(otherUser._id);

    if (isFollowing) {
      // If already following, unfollow
      currentUser.following.pull(otherUser._id);
      otherUser.followers.pull(currentUser._id);
    } else {
      // If not following, follow
      currentUser.following.push(otherUser._id);
      otherUser.followers.push(currentUser._id);
    }

    await currentUser.save();
    await otherUser.save();

    res.redirect(`/profile/${req.params.username}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Comment code

router.post('/post/:postId/comment', isLoggedIn, async (req, res) => {
  try {
      const postId = req.params.postId;
      const user = await userModel.findOne({ username: req.session.passport.user });
      const commentText = req.body.text;

      const post = await postModel.findById(postId).populate('comments.user');
      if (!post) {
          return res.status(404).send("Post not found");
      }

      post.comments.push({
          user: user._id,
          text: commentText,
      });

      const updatedPost = await post.save();
      res.render('post-detail', { post: updatedPost });
  } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
  }
});

router.get('/savedPosts',async function(req,res){
  const loggedInUser = await userModel.findOne({ username: req.session.passport.user }).populate('saves');
  res.render('savedPosts',{loggedInUser});
})

router.get('/save/:postId',async function(req,res){
  const postId = req.params.postId;
  const currentPost = await postModel.findOne({_id:postId});

  const loggedInUser = await userModel.findOne({ username: req.session.passport.user }).populate('saves');


   // Check if the post is already saved
   if (!loggedInUser.saves.includes(postId)) {
    loggedInUser.saves.push(postId);
    await loggedInUser.save();
  }


  res.render('savedPosts',{loggedInUser});
})

module.exports = router;
