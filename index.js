const bodyParser = require('body-parser');
const express = require('express');
const app = express()
const port = 3000;
const Route = require('./src/Route/userRoute');
const database = require('./src/config/database');



app.use(express.json());

app.get("/hello",(req,res)=>{
    res.status(200).json("Hello world");
})

app.use('/', Route);

app.use(bodyParser.json());
database();



app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})