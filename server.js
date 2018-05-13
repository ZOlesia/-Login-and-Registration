
const   express = require("express"),
        app = express(),
        path = require("path"),
        bodyParser = require('body-parser'),
        session = require('express-session'),
        mongoose = require('mongoose'),
        flash = require('express-flash'),
        uniqueValidator = require('mongoose-unique-validator'),
        bcrypt = require('bcrypt'),
        saltRounds = 10;


app.use(session({
    secret: 'keyboardkitteh',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
}))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "./static")));
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/login_mongoose');
app.use(flash());


var UserSchema = new mongoose.Schema({
    first_name :{type: String, required: [true, 'First Name field at least 2 characters'], minlength: 2},
    last_name :{type: String, required: [true, 'Last Name field at least 2 characters'], minlength: 2},
    email :{type: String, required: [true, 'Email is required'], uniqueCaseInsensitive: [true, 'Email is already in use']},
    password: {type: String, required: true, minlength: 6},
    dob :{type: Date}
}, {timestamps: true})
UserSchema.plugin(uniqueValidator, { message: '{PATH} is already in use}' });
var User = mongoose.model('User', UserSchema);



app.get('/' , function(req, res){
    res.render('index');
})

app.post('/register', function(req, res){
    bcrypt.hash(req.body.password, saltRounds, function(err, hash){
        if(req.body.password !== req.body.conf_password){
            req.flash("password_match", "passwords must match");
            console.log('***************PASSWORD DOESNT MATCH***************');
            res.redirect('/');
        }
        else{
            console.log(req.body);
            var newUser = new User({first_name: req.body.firstname, 
                                    last_name: req.body.lastname, 
                                    email: req.body.email, 
                                    password: hash,
                                    dob: req.body.dob
                                });
            console.log(newUser);
            console.log(newUser.password + " ********************");
            newUser.save(function(err){
                if(err){
                    console.log('ERROR REGISTER');
                    for(var key in err.errors){
                        req.flash("registration", err.errors[key].message)
                    }
                    
                    req.flash("usedemail", "Email is already in use");
                    res.redirect('/');
                }
                else{
                    console.log('YOU SAVED NEW USER');
                    res.render('success', {user:newUser});
                }
            })

        }
    })
})



app.post('/login', (req, res) => {
    User.findOne({email: req.body.loginemail}, (err, user) => {
        console.log(user);
        if(user == null || err){
            console.log('******NO USER********');
            req.flash("loginemail", "Please check your email otherwise go to register");
            res.redirect('/');
        }
        else{
            bcrypt.compare(req.body.loginpw, user.password, (err, psw) => {
                if(psw){
                    res.render('success', {user:user});                }
                else{
                    console.log('***************PASSWORD IS INCORRECT************');
                    req.flash("loginpw", "Password is incorrect");
                    res.redirect('/');
                }
            });
        }
    })
})



app.listen(1337, function() {
    console.log("listening on port 1337");
});


