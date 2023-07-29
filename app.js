const express=require('express');
const mysql=require('mysql2');
const ejs=require('ejs');
const bodyParser=require('body-parser');
const bcrypt=require('bcrypt');

const app=express();
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.set("view engine","ejs");

// connecting to database
const connection=mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"mohit2001",
    database:"newsletter"
});

// table schema for users table
const usersTable = "create table if not exists users ( \
	id int not null auto_increment,\
	email varchar(100) not null,\
	password varchar(100) not null,\
	primary key(id)\
)";

// table schema for news table
const newsTable = "create table if not exists news ( \
    id int not null auto_increment,\
    name varchar(100) not null,\
    primary key(id)\
    )";

// table schema for users_news table
const usersNews = "create table if not exists usernews (\
    user_id int not null,\
    news_id int not null,\
    news_name varchar(100) not null,\
    foreign key(user_id) references users(id),\
    foreign key(news_id) references news(id)\
    )";

// queries for creating tables
connection.query(usersTable,function(){
    console.log("Users table created!");
});

connection.query(newsTable,function(){
    console.log("News table created!");
});

connection.query(usersNews,function(){
    console.log("users_news table created");
});

const saltRounds=10;
let login=false; // for checking if user is logged in 
let userEmail = "";

// server methods
app.listen(3000,function(){
    console.log("Server is running on port 3000");
});

app.get("/",function(req,res){
    res.render("home",{pageName:"Sign In"});
});

app.get("/user",function(req,res){
    if(login===true)
    {
        const query="select name from news";
        connection.query(query,function(err,results,fields){
            res.render("user",{pageName:"User Dashboard",userEmail:userEmail,availNews:results});
        });
    }
    else
        res.redirect("/");
});

app.post("/",function(req,res){
    const email=req.body.email;
    const password=req.body.password;
    
    // first check in database
    const checkInDatabase="select * from users where email=?";
    connection.query(checkInDatabase,[email],function(err,results,fields){
        if(results.length===0)
        {
            // not present in database, add to database and render user.ejs
            const addToDatabase="insert into users(email,password) values(?,?)";
            bcrypt.hash(password,saltRounds,function(err,hash){
                connection.query(addToDatabase,[email,hash],function(err,results,fields){
                    if(err)
                        console.log(err);
                    else
                    {
                        console.log("User Registered !");
                        login=true;
                        userEmail=email;
                        res.redirect("/user");
                    }
                });
            });
        }
        else
        {
            bcrypt.compare(password,results[0].password,function(err,result){
                if(result===true)
                {
                    console.log("Success");
                    login=true;
                    userEmail=email;
                    res.redirect("/user");
                }
                else
                {
                    console.log("Invalid Credentials!");
                    res.send("Invalid Credentials !");
                }
            });
        }
    });
});

// add newsletter
app.post("/addNewsletter",function(req,res){
    const newsName = req.body.newsletterName;
    const query="insert into news(name) values(?)";
    connection.query(query,[newsName],function(err,results,fields){
        console.log("Newsletter added !");
        res.redirect("/user");
    });
});

// logout route
app.post("/logout",function(req,res){
    login=false;
    userEmail="";
    res.redirect("/");
});