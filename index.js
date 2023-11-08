const express = require('express')
const jwt = require('jsonwebtoken');
//to get cookies from client side we require cookie purser
const cookieParser=require('cookie-parser')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
var cors = require('cors')

//middleware: just connecting client and server
app.use(cors({
  origin:['http://localhost:5173'],
  credentials:true
}))
app.use(cookieParser())
const verifyToken=async(req,res,next)=>{
  //here we are receiving the token which is stored at client side cookies
  const token=req.cookies?.token;
  console.log('value of token in middleware,receiving from client side',token);
  if(!token)
  {
    return res.status(401).send({message:'Not Authorized'})
  }
  jwt.verify(token,process.env.secret_code,(err,decoded)=>{
    if(err){
      console.log(err);
      return res.status(401).send({message:'Not Authorized'})
    }
    console.log('found match! value in the token',decoded);
    req.user=decoded;
    next();
  })
  
}
app.use(express.json())
const port = 3000 || process.env.PORT;
//client sending request to server for data that is req
//on that req server send response that is res


 
const uri = `mongodb+srv://${process.env.db_user}:${process.env.db_pass}@cluster0.kf7gnio.mongodb.net/?retryWrites=true&w=majority`;
console.log();
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const database = client.db('jobline');
    const job_cat_collection = database.collection('job_category');
    const job_collection=database.collection('job')
    const resume_collection=database.collection('resume')


        // token related api
    // For creation of token, creating a route in server called jwt 

    app.post('/jwt',async(req,res)=>{
      const user=req.body; // here,in server we are fetching client details like email send by client
      console.log(user,'we are starting creation of token');
      const token=jwt.sign(user,process.env.secret_code,{ expiresIn: '1h' })
      console.log(user,'Token Created successfully',token);
      res.cookie('token',token,{
        httpOnly:true,
        secure:false,
        sameSite:'none'
      })
      .send({success:true});
    })

    app.post('/logOut',async(req,res)=>{
      const user=req.body;
      console.log(user,'logged out');
      res.clearCookie('token',{maxAge:0}).send({success:true})
    })


    //update form
    //update data from database
    app.put('/jobsUp/:id', async (req, res) => {
      const id=req.params.id;
      const updatedData=req.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
      $set: {
        jobTitle:updatedData.jobTitle,
        jobCategory:updatedData.jobCategory,
        salary:updatedData.salary,
        description:updatedData.description,
        jobPostingDate:updatedData.jobPostingDate,
        jobDateDeadline:updatedData.jobDateDeadline,
        photo:updatedData.photo,
        }
      }
      const result = await job_collection.updateOne(query,updateDoc,options);
      res.send(result);
    })

    //delete job data
   
    app.delete('/jobsDel/:id', async (req, res) => {
      const id=req.params.id;
      console.log('please delete from database',id);
      const query = { _id: new ObjectId(id) };
      const result = await job_collection .deleteOne(query);
      res.send(result);
      if (result.deletedCount === 1) {
        console.log("Successfully deleted one document.");
      } else {
        console.log("No documents matched the query. Deleted 0 documents.");
      }
    })  

    // Send a ping to confirm a successful connection
    app.get('/jobCategory',async(req,res)=>{
        const cursor=job_cat_collection.find();
        const result=await cursor.toArray();
        res.send(result);
    })

    app.get('/jobs',async(req,res)=>{
        const cursor=job_collection.find();
        const result=await cursor.toArray();
        res.send(result);
    })
    app.get('/resume',async(req,res)=>{
        const cursor=resume_collection.find();
        const result=await cursor.toArray();
        res.send(result);
    })

    app.get('/jobs/:id',async(req,res)=>{
    const id=req.params.id;
    console.log('please send data from database',id);
    const query = { _id: new ObjectId(id) };
    const result = await job_collection.findOne(query);
    res.send(result);
  })   
//post job
    app.post('/jobs', async (req,res)=>{
        const jobs_list=req.body;
        console.log('hello',jobs_list);
        const result = await job_collection.insertOne(jobs_list);
        console.log(`A document was inserted with the _id: ${result.insertedId}`);
        res.send(result);
    })
//post resume
    app.post('/resume', async (req,res)=>{
        const resume_list=req.body;
        console.log('hello',resume_list);
        const result = await resume_collection.insertOne(resume_list);
        console.log(`A document was inserted with the _id: ${result.insertedId}`);
        res.send(result);
    })
  //update in
  app.put('/jobs/:id', async (req, res) => {
    const id=req.params.id;
    const updateApplicants=req.body;
    const query = { _id: new ObjectId(id) };
    console.log(query,updateApplicants);
    const result=await job_collection.updateOne(
      { _id: new ObjectId(id) },
      { $inc: { "applicants":1 } }
    )
    res.send(result);
  })

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
   // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!Jobline is listening')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})