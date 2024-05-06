//jshint esversion: 6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");

const app = express();
const path = require('path');

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const mongoURI = "mongodb://127.0.0.1:27017/studentDB";
const ISHAN_S_PHONE = '+918495086756';

mongoose.connect(mongoURI, { useNewUrlParser: true });

const accountSid = "AC33cd83e62d42751e089bebf8d5ced21d";
const authToken = "05f8cdb08928a61542681c47e2dc5c9c";
const client = require('twilio')(accountSid, authToken);

const studentSchema = {
    name: {
        type: String,
        required: true,
    },
    adhaarNumber: {
        type: Number,
        min: 1000_0000_0000,
        max: 9999_9999_9999,
        required: true,
    },
    ssmid: {
        type: Number,
        min: 1000_0000,
        max: 9999_9999,
        default:10000001,
        required: true,
    },
   // heiNumber: {
     //   type: Number,
    //    min: 0000,
     //   max: 9999,
       // required: true,
    //},
    phoneNumber: {
        type: Number,
        min: 1_000_000_000,
        max: 9_999_999_999,
        required: true,
    },
    degree: String,
};

const verificationSchema = {
    phoneNumber: {
        type: String,
        required: true
    },
    otp: {
        type: Number,
        min: 0,
        max: 999_999
    }
}

const Student = mongoose.model("Student", studentSchema);
const Verification  = mongoose.model("Verification", verificationSchema);

//const student1 = new Student({
//    name: "shiv",
///    adhaarNumber: 601092587978,
 //   phoneNumber: 8495086756,
 //   degree: "BE",
//});
 //student1.save();

// Student.insertMany([student1, student2, student3, student4, student5, student6, student7, student8, student9, student10], function (err) {
//     if (err) {
//         console.log("Cannot insert items");
//     }
//     else {
//         console.log("No error");
//     }
// });

// Student.find(function (err, students) {
//     if (err) {
//         console.log("cannot find students");
//     }
//     else {
//         console.log(students);
//     }
// });

app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.get("/signup", function (req, res) {
    res.render("signup", { errorMessage: "" });
});

app.post("/signup", function (req, res) {
    const list = req.body;
    if (list.name === "") {
        res.render("signup", { errorMessage: "Please enter the name" });
    }
    // let i = 0;
    // if(i === 0) {
    //     Student.find( {adhaarNumber: list.adhaarNumber}, function (err, students) {
    //         if (err) {
    //             console.log("error");
    //         }
    //         else if (students.length > 0) {
    //             var i = 1;
    //             console.log(students);
    //         }
    //         // if (i == 1){
    //         //     res.render("signup", { errorMessage: "go log in" });
    //         // }
    //     });
    // }
    if (list.adhaarNumber < 100_000_000_000 || list.adhaarNumber > 999_999_999_999) {
        res.render("signup", { errorMessage: "Please enter the adhaar num" });
    }
    if (list.phoneNumber < 1_000_000_000 || list.phoneNumber > 9_999_999_999) {
        res.render("signup", { errorMessage: "Please enter the phone num" });
    }
    if (list.degree === "") {
        res.render("signup", { errorMessage: "Please enter degree" });
    }
    else {
        const student1 = new Student({
            name: list.name,
            adhaarNumber: list.adhaarNumber,
            phoneNumber: list.phoneNumber,
            degree: list.degree,
        });
        student1.save();
        res.redirect("/login");
    }
});

app.get("/login", function (req, res) {
    res.render("login", { errorMessage: "" });
});

app.get("/login_ssmid", function (req, res) {
    res.render("login_ssmid", { errorMessage: "" });
});

app.post("/login", function (req, res) {
    const list = req.body;
    var phoneNumber = 1234123412;
    if (list.adhaarNumber) {
        this.verifyAadhar(list, phoneNumber, res);
    }
    else {
        this.verifySsmid(list, phoneNumber, res);
    }
});

verifyAadhar = (list, phoneNumber, res) => {
    if (list.adhaarNumber < 100_000_000_000 || list.adhaarNumber > 999_999_999_999) {
        res.render("login", { errorMessage: "Please enter the adhaar num" });
    }
    else {
        Student.find({ adhaarNumber: list.adhaarNumber, heiNumber: list.heiNumber }, function (err, students) {
            if (err) {
                console.log("Error Occured");
            }
            else if (typeof window !== 'undefined') {
                phoneNumber = students[0].phoneNumber;
                sessionStorage.setItem("PhoneNum", phoneNumber);
            }
        });
        res.redirect("/otp_verify");
    }
} 

verifySsmid = (list, phoneNumber, res) => {
    if (list.ssmid < 10_000_000 || list.ssmid > 99_999_999) {
        res.render("login", { errorMessage: "Please enter the SSMID" });
    }
    else {
        Student.find({ ssmid: list.ssmid }, function (err, students) {
            if (err) {
                console.log("Error Occured");
            }
            else if (typeof window !== 'undefined') {
                phoneNumber = students[0].phoneNumber;
                sessionStorage.setItem("PhoneNum", phoneNumber);
            }
        });
        res.redirect("/otp_verify");
    }
} 

app.get("/otp_verify", function (req, res) {
    res.render("otp_login", { errorMessage: "" });
    if (typeof window !== 'undefined') {
        var phoneNumber = sessionStorage.getItem("phoneNum");
    }
    var otp = Math.floor(Math.random() * 1000000);
    // const verification = new Verification({
    //     phoneNumber: phoneNumber,
    //     adhaarNumber: otp,
    // });
    // verification.save();

    client.messages
        .create({
            body: otp,
            from: '+13515296727',
            to: ISHAN_S_PHONE,
        })
        .then(message => console.log(message.sid));
    if (typeof window !== 'undefined') {
        sessionStorage.clear();
        sessionStorage.setItem("OTP", otp);
    }
});

app.post("/otp_verify", function (req, res) {
    return res.redirect("/portal");
    var otp;
    if (typeof window !== 'undefined') {
        otp = sessionStorage.getItem("OTP");
    }

    console.log(req.body)

    if (req.body.phoneNumber || !req.body.heiNumber) {
        return res.render("otp_login", { errorMessage: "enter correct OTP" });
    }
    
    Verification.find({ phoneNumber: req.body.phoneNumber, heiNumber: req.body.heiNumber }, function (err, verification) {
        if (err) {
            // console.log("Error Occured");
        }
        else if (typeof window !== 'undefined') {
            phoneNumber = students[0].phoneNumber;
            sessionStorage.setItem("PhoneNum", phoneNumber);
        }
        
        if (req.body.otp !== verification.otp) {
            res.render("otp_login", { errorMessage: "enter correct OTP" });
        }
        res.redirect("/portal");

    });
});

app.get("/portal", function (req, res) {
    res.render("portal");
});

app.listen(3000, function () {
    console.log("Server started on port 3000");
});