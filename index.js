const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
try{
  mongoose.connect(process.env.MONGO_URI);
  console.log('DB Connected');
}catch(err){
  console.log(err);
}

const userSchema = mongoose.Schema({
  username: {
    type:String,
    unique:true,
  }
},{versionKey:false})

const exerciseSchema = mongoose.Schema({
 user_id :{type:String, required:true},
 description:String,
 duration:Number,
 date:Date
},{versionKey:false})
const User = mongoose.model('User',userSchema);
const Exercise = mongoose.model('exercise',exerciseSchema);

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
})

app.post('/api/users',async(req,res)=>{
  try{

    const userName = req.body.username;
    const foundUser = await User.findOne({username:userName})
    
    if(foundUser){
      return res.json(foundUser);
    }
    const user = User.create({username:userName})
    await user.save();
    console.log(user);
    return res.json(user);
  }catch(err){
    console.log(err);
  }
})

app.get('/api/users',async (req,res)=>{
  try{
    let user = await User.find();
    console.log(user)
    res.send(user);
  }catch(err){
    console.log(err);
  }
})

app.post('/api/users/:_id/exercises',async (req,res)=>{
  try{

    const id = req.params._id;
    const {description,duration,date} = req.body;

    try{
      const user = await User.findById(id);
      if(!user){
        res.send("Could not find user");
      }else{
        const exerciseObj = await Exercise.create({
          user_id:user._id,
          description ,
          duration  ,
          date:date? new Date(date):new Date()
        })
        const exercise = await exerciseObj.save();
        res.json({
          _id:user._id,
          username:user.username,
          description:exercise.description,
          duration:exercise.duration,
          date: new Date(exercise.date).toDateString()
        })
      }
    }catch(err){
        console.log(err)
        res.send("There was an error");
    }
  }catch(err){
    console.log(err);
  }
})

app.get('/api/users/:_id/logs',async (req,res)=>{
  try{
    let {from,to,limit} = req.query;
    if(!limit){
      limit = 100
    }
    const id = req.params._id;
    const user = await User.findById(id)
    let filter = {user_id:id};
    if(!user){
      res.send("Could not find the user")
      return;
    }
    let dateObj = {}
  
    if(from){
      dateObj["$gte"]= new Date(from);
    }
    if(to){
      dateObj["$lte"]= new Date(to);
    }
    if(from || to){
      filter.date = dateObj;
    }
  
    const exercises = await Exercise.find(filter).limit(+limit)
    const log = exercises.map(e=>({
      description:e.description,
      duration:e.duration,
      date:e.date.toDateString()
    }))
    console.log(exercises)
    const count = exercises.length
    res.json({
      username:user.username,
      count:count,
      _id:id,
      log:log
    })
  }catch(err){
    console.log(err);
  }
})
const listener = app.listen(process.env.PORT || 4000, () =>{
  console.log('Your app is listening on port ' + listener.address().port)
})
