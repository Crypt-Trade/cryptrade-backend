const User = require('../models/User');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();
const { findPositionAndAttach } = require('../utils/placeInBinaryTree');

// Function to generate unique sponsor ID
async function generateUniqueSponsorID() {
    let isUnique = false;
    let randomNumber;

    while (!isUnique) {
        randomNumber = generateRandom7DigitNumber();
        const existingUser = await User.findOne({ sponsorId: `UD${randomNumber}` });
        if (!existingUser) {
            isUnique = true;
        }
    }

    return `UD${randomNumber}`;
}

// Function to generate random 7-digit number
function generateRandom7DigitNumber() {
    return Math.floor(1000000 + Math.random() * 9000000);
}

// Function to send email notification
async function sendEmailNotification(email, name, generatedSponsorId, password, uniqueKey) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    let mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Registration Successful',
        text: `Hello ${name},\n\nYour account has been created successfully.\nSponsor ID: ${generatedSponsorId}.\nPassword: ${password}.\nUnique Key: ${uniqueKey}\n\nThank you!`
    };

    await transporter.sendMail(mailOptions);
}

// Funtion to Generate Unique Key
async function generateUniqueKey() {
    let key;
    let existingUser;
    do {
        key = Math.floor(10000 + Math.random() * 90000).toString(); // Generate a 5-digit random key
        existingUser = await User.findOne({ uniqueKey: key }); // Check if it already exists
    } while (existingUser); // If key exists, generate a new one
    return key;
}

// Register the first user (Admin)
// async function handleRegisterFirstUser(req, res) {
//     try {
//         const count = await User.countDocuments();
//         if (count !== 0) {
//             return res.status(400).json({ message: 'Admin already exists!' });
//         }

//         const { name, email, phoneNumber, password } = req.body;
//         if (!name || !email || !phoneNumber || !password) {
//             return res.status(400).json({ message: 'Please provide all required fields' });
//         }

//         const sponsorId = await generateUniqueSponsorID();
//         const leftReferralLink = `https://yourdomain.com/signupleft/${sponsorId}`;
//         const rightReferralLink = `https://yourdomain.com/signupright/${sponsorId}`;

//         const newUser = new User({
//             name,
//             email,
//             phoneNumber,
//             password,
//             sponsorId,
//             leftReferralLink,
//             rightReferralLink
//         });

//         await newUser.save();
//         await sendEmailNotification(email, name, sponsorId);

//         return res.status(201).json({ message: 'Admin registered successfully', user: newUser });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Server error', error: error.message });
//     }
// }



async function handleRegisterFirstUser(req, res) {
    try {
        const count = await User.countDocuments();
        if (count !== 0) { return res.status(404).json({ message: 'First user already exists!' }) }

        if (count === 0) {
            const {
                sponsorId,
                name,
                mobileNumber,
                email,
                password
            } = req.body;


            // Check all parameters are recieved or not 
            if (!name || !mobileNumber || !email || !password) {
                return res.status(400).json({ message: 'Please provide all required fields' });
            }

            // First user registration (admin/root user)
            let generatedSponsorId = await generateUniqueSponsorID();
            const leftRefferalLink = `https://myudbhab.in/signupleft/${generatedSponsorId}`;
            const rightRefferalLink = `https://myudbhab.in/signupright/${generatedSponsorId}`;

            // Generate a unique 5-digit key
            const uniqueKey = await generateUniqueKey();

            const newUser = await User.create({
                sponsorId: generatedSponsorId,
                name,
                mobileNumber,
                email,
                password,
                parentSponsorId: '',
                mySponsorId: generatedSponsorId,
                leftRefferalLink,
                rightRefferalLink,
                uniqueKey
            });

            await sendEmailNotification(email, name, generatedSponsorId, password, uniqueKey);

            return res.status(201).json({ message: 'First user registered successfully', user: newUser });
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error', error: e.message });
    }
}



async function handleRegisterUser(req, res) {
    try {
        const count = await User.countDocuments();
        if (count === 0) { return res.status(404).json({ message: 'No tree exists. Firstly Register root user.' }) }

        const {
            sponsorId,
            name,
            mobileNumber,
            email,
            password
        } = req.body;

        // Check all parameters are recieved or not 
        if (!sponsorId || !name || !mobileNumber || !email || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Check if the Sponsor ID exists in the database
        const sponsor = await User.findOne({ mySponsorId: sponsorId });
        if (!sponsor) { return res.status(400).json({ message: 'Invalid Sponsor ID' }); }

        // Check if email is already registered
        let userFound = await User.findOne({ email: email });
        if (userFound) { return res.status(404).json({ message: 'Email is already registered' }); }

        // Check if Phone is already registered
        let phoneFound = await User.findOne({ mobileNumber: mobileNumber });
        if (phoneFound) { return res.status(404).json({ message: 'Phone number is already registered' }); }




        // Generate a unique mySponsorId
        let generatedSponsorId = await generateUniqueSponsorID();
        const leftRefferalLink = `https://myudbhab.in/signupleft/${generatedSponsorId}`;
        const rightRefferalLink = `https://myudbhab.in/signupright/${generatedSponsorId}`;

        // Generate a unique 5-digit key
        const uniqueKey = await generateUniqueKey();

        // Create new user
        const newUser = await User.create({
            sponsorId,
            name,
            mobileNumber,
            email,
            password,
            parentSponsorId: '',
            mySponsorId: generatedSponsorId,
            leftRefferalLink,
            rightRefferalLink,
            uniqueKey
        });

        // Attach to sponsor's binary tree
        await findPositionAndAttach(sponsor, newUser);
        const emailResponse = await sendEmailNotification(email, name, generatedSponsorId, password, uniqueKey);

        if (emailResponse === 'error') {
            console.error('Failed to send registration email.');
        }
        return res.status(201).json({ message: 'User registered successfully', user: newUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}



module.exports = {
    handleRegisterFirstUser,
    handleRegisterUser
};