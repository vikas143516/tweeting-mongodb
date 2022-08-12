const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express')
const app = express()
const port = 3000
var bodyParser = require('body-parser')
app.use(bodyParser.json())
var fs = require('fs')
const jwt = require('jsonwebtoken');
require("dotenv").config();
app.listen(port, function () {
  console.log("Server is running on localhost3000");
});
const uri = "mongodb+srv://vikas:*********@cluster0.9xttcrp.mongodb.net/?retryWrites=true&w=majority";  
const client = new MongoClient(uri);
client.connect();
app.post('/create', async (req, res) => {
    if(req.body.password.length < 5)
    {
        res.status(401).send("password sholud be more than 6 letters")
        return
    }
    // await client.db("work").collection("tweets").insertOne({"${req.body.username}" : []})
    try{
      var collection = await client.db("work").collection("twitter").find({}).toArray();
      console.log(collection)
      await client.db("work").collection("tweets").insertOne({"username" : req.body.username,"tweets" : []})
      if(collection.length !== 0){
          for(var index = 0;index < collection.length;index++)
          {
            if(req.body.username === collection[index].username)
            {
                res.status(401).send('user already exist...');
            }
          }
      }
      await client.db("work").collection("twitter").insertOne({"username": req.body.username, "password":req.body.password,"following": []})
      res.status(200).send("user created successfully")
    }
    catch {
        res.status(404).send("database not found")
    }
})

// put /user

app.put('/edit',authentication, async(req, res) => {
    let size = Object.keys(req.body).length;
    if(size === 1)
    { 
        try{
          var collection = await client.db("work").collection("twitter").find({}).toArray();
          for(var index = 0;index < collection.length;index++)
          {
             if(req.user === collection[index].username)
             {
                await client.db("work").collection("twitter").updateOne({username: req.user}, {$set:{password: req.body.password}})
                res.status(401).send('password updated successfully');
             }
          }
        res.status(404).send("user not exist...")
        }
        catch{
        res.status(404).send("database is missing")
        }
    }
    else
        res.status(401).send("invalid arguments to update user")
})

app.post('/login', async (req, res) => {
    let size = Object.keys(req.body).length;
    if(size === 2)
    { 
        try{

            var collection = await client.db("work").collection("twitter").find({}).toArray();
            for(var index = 0;index < collection.length;index++)
            {
             if(req.body.username === collection[index].username && req.body.password === collection[index].password)
             {
              let token = jwt.sign(req.body.username, process.env.JWT_SECRET_KEY);
              console.log(token)
              return res.status(200).send(token)
             }
            }
            return res.status(401).send("invalid username and password")
          }
        catch{
        res.status(404).send("database is missing")
        }
    }
    else
        res.status(401).send("invalid arguments for login user")
});

app.put('/follow', authentication, async (req, res) => {
    let size = Object.keys(req.body).length;
    if(size === 1)
    { 
        try{
            var user = await client.db("work").collection("twitter").find({"username" : req.user}).toArray()
            var list = Object.values(user[0].following || {});
            if(list.indexOf(req.body.follow) !== -1)
            {
                res.status(200).send("user alredy follwing...")
            }
            for(var index = 0;index < collection.length;index++)
            {
               if(req.body.follow === collection[index].username)
               {
                  list.push(req.body.follow);
                  await client.db("work").collection("twitter").updateOne({"username" : req.user},{$set:{following: list}})
                  res.status(200).send("started following....")
               }
            }  
        }
        catch{
            res.status(404).send("database is missing")
        }
    }
    else
        res.status(401).send("invalid arguments to update user") 

})

app.post('/tweet',authentication, async (req, res) => {
    let size = Object.keys(req.body).length;
    if(size === 1)
    { 
        try{
            var user = await client.db("work").collection("tweets").find({"username" : req.user}).toArray() 
                var list = Object.values(user[0].tweet || {});
                list.push(`${req.body.tweet} ---- ${new Date().toString()}`);
                await client.db("work").collection("tweets").updateOne({"username" : req.user},{$set:{tweet: list}})
                res.status(200).send("tweet added successfully")
        }
        catch{
        res.status(404).send("database is missing")
        }
    }
    else
        res.status(401).send("invalid arguments for tweeting") 
    

})

app.get('/mytweets',authentication,async(req,res) =>{
    let size = Object.keys(req.body).length;
    if(size === 0)
    { 
        console.log(req.user,"hello")
        var user = await client.db("work").collection("tweets").find({"username" : req.user}).toArray()
        console.log("hello")
        try{
                var user = await client.db("work").collection("tweets").find({"username" : req.user}).toArray() 
                var list = Object.values(user[0].tweet || {});
                let dict = {}
                for(let i=0;i<list.length;i++)
                {
                    dict[list[i].split('----')[1]] = list[i].split('----')[0]
                }
                let tsize = Object.keys(dict).length;
                if(tsize === 0)
                    res.status(200).send("No tweets yet...")
                else
                    res.status(200).send(dict)
        }
        catch{
        res.status(404).send("database is missing")
        }
    }

})

app.get('/timeline',authentication,async (req,res) => {
    let size = Object.keys(req.body).length;
    let tweetsArray = []
    if(size === 0)
    { 
        try{
            var user = await client.db("work").collection("twitter").find({"username" : req.user}).toArray()
            var list = Object.values(user[0].following || {});
            for(let j=0;j<list.length;j++)
            {
                var follower = await client.db("work").collection("tweets").find({"username" : list[j]}).toArray()
                var ulist = Object.values(follower[0].tweet || {});
                let dict = {}
                for(let i=0;i<ulist.length;i++)
                {
                    dict["tweet"] = ulist[i].split("----")[0]
                    dict["time"]  = ulist[i].split("----")[1]
                    dict['author'] = list[j]
                }
                if(Object.keys(dict).length !== 0)
                    tweetsArray.push(dict)
            }
            if(tweetsArray.length !== 0)
            {
                res.status(200).send(tweetsArray)
            }
            else
            {
                res.status(200).send("your timeline is empty...")
            }
        }
        catch{
        res.status(404).send("database is missing")
        }
    }
    else
        res.status(404).send("invalid arguments for timeline") 

})

function authentication(req,res,next)
{    

    let authHeader = req.headers['authorization']
    let token = authHeader && authHeader.split(' ')[1]
    if(token === null){return res.status(200).sendStatus(401)}
    jwt.verify(token, process.env.JWT_SECRET_KEY,(err,user) => {
        if(err){ 
            return res.status(200).sendStatus(403)
        }
        req.user = user
        next()
    })
}
