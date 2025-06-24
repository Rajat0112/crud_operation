
const mongoose = require('mongoose');

 const db = ()=>{
const connection = mongoose.connect('mongodb://127.0.0.1:27017/first-data-1')
if(connection){
    console.info("connected Database");
}else{
    console.error("connection failed")
}
}


module.exports = db;