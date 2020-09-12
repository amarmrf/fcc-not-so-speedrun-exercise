const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const mongoose = require('mongoose')
const mongo = require('mongodb');


process.env.MONGO_URI="mongodb+srv://amarmrf1:1XtalEWZM4fQReuB@cluster0.ecjxz.mongodb.net/Cluster0?retryWrites=true&w=majority"

const uri = process.env.MONGO_URI;

mongoose.connect(uri,{useNewUrlParser: true, useUnifiedTopology: true });

var Schema = mongoose.Schema
 
var exerSchema =new Schema({username: String, count:Number, log:[{description:String,duration:Number,date:{type:Date}}]
});

var ExerModel=mongoose.model('ExerModel', exerSchema)


app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

console.log("mongoose ready state:", mongoose.connection.readyState)

var done = (err,data) => {
       if(err) console.error(err);
       //do what you want to do after the operation completes.
       console.log('Done')
}

  var dateObject = new Date;
  var dateobj = dateObject.toDateString();

const dateConverter = (dateIn) => {
  if (!dateIn) {return dateobj}
  else {
    let dateOnly=new Date(dateIn);
    let dateParsed=dateOnly.toDateString();
    return dateParsed}
}


//new user
app.post("/api/exercise/new-user",(req,res)=>{
  let unameInput = req.body.username
  ExerModel.findOne({username:unameInput}, (err,data)=>{
    if (err) return console.error(err);
    if (data){//old: must already be validated in the past
      res.send("Username already taken")
      done(null, data);    
      } else{//new: must be validated
      let newUser = new ExerModel(//save
      {username:unameInput, count:0, log:[]
      });
      newUser.save(function(err,data){
        if (err) return console.error(err);
        res.json({username:data.username, _id:data._id})
        done(null, data);
      })
      done(null, data);
    } 
  })//close model callback 
  }//close handler
) //close method

app.get("/api/exercise/users",(req,res)=>{
  ExerModel.find({},(err,data)=>{
    if (err) return console.error(err)
    let resp = data.map(user=>{
      let output = {"username":user["username"],"_id":user["_id"]};
      return output
    })
    res.send(resp)
  })
})


app.post("/api/exercise/add",(req,res,next)=>{
  //set condition if date or duration is bad
  req.body.date = dateConverter(req.body.date)
  if (req.body.date=="Invalid Date"){res.send(req.body.date)
  } else if (isNaN(req.body.duration)){res.send("Invalid field: duration")
  } else if (req.body.description==""){
      res.send("The field 'description' is empty")
  } else {
    ExerModel.findOne({_id:req.body.userId}, (err,data)=>{
        delete req.body.userId;
        if (data){
            data.log.push(req.body);
            data.count = data.log.length;
            data.save(function(err,updatedData){
              if (err) return console.error(err);
              const respObject = {
                username: updatedData.username,
                description: req.body.description,
                duration:Number(req.body.duration),
                _id: updatedData._id,
                date:req.body.date
                }//respObject closure
              res.json(respObject)
              done(null, updatedData);
            })//data.save closure
          } else {
          res.send("Invalid Id")
        }
      })}//mongo callback
  })//route handler

   app.get("/api/exercise/log",(req,res)=>{
    if (req.query.userId){
      ExerModel.findOne({_id:req.query.userId},(err,data)=>{
          if(!data){res.send("Invalid Id")} else {
            let resplog = data.log.map(x=> {
                  let logDrop = {
                    description: x.description,
                    duration: x.duration,
                    date: x.date
                    };
                    return logDrop})
                    
                    if (req.query.from){let dateFrom = new Date(req.query.from).getTime() / 1000;
                    if (dateConverter(req.query.from)!="Invalid Date"){
                      resplog = resplog.filter(x=>(new Date(x.date).getTime() / 1000)>=dateFrom)
                    }} else{resplog=resplog}

                    if (req.query.to){let dateTo = new Date(req.query.to).getTime() / 1000;
                    if (dateConverter(req.query.to)!="Invalid Date"){
                      resplog = resplog.filter(x=>(new Date(x.date).getTime() / 1000)<=dateTo)
                    }} else{resplog=resplog}
                    
                    resplog = resplog.map(x=>{
                      let y=dateConverter(x.date);
                    x.date=y;
                    return x})

                    let limitOut = resplog.length-1;
                    if (parseInt(req.query.limit)>0){
                      limitOut = req.query.limit
                    } else {limitOut=resplog.length}

                    let reresplog = resplog.filter(x=>resplog.indexOf(x)<limitOut)
                    

                    let resobj= {
                      _id:data._id,
                        username:data.username
                        
                    }

                    if(req.query.from&&dateConverter(req.query.from)!="Invalid Date"){resobj.from=dateConverter(req.query.from)}

                    if(req.query.to&&dateConverter(req.query.to)!="Invalid Date"){resobj.to=dateConverter(req.query.to)}

                    resobj.count=reresplog.length

                    resobj.log=reresplog
            
                    res.send(resobj)
          }//close else, data exist
      })//close mongo
    } 
    else {res.send("Please enter userId")}//close else 
  })//close method handler


  // Not found middleware
  app.use((req, res, next) => {
    return next({status: 404, message: 'not found'})
  })

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

//retrieve log partial
//retrieve log full 
//input log all condition
//retrieve all users
//new user



      
        //output Object
        /**
         * 
         * 
         */
        
  