const User = require('../models/User');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const generateToken = require('../utils/generateToken');
require('dotenv').config();
const { findPositionAndAttach, placeInLeftSideOfTree, placeInRightSideOfTree } = require('../utils/placeInBinaryTree');

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
        const leftRefferalLink = `http://localhost:5173/signupleft/${generatedSponsorId}`;
        const rightRefferalLink = `http://localhost:5173/signupright/${generatedSponsorId}`;

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

async function handleVerifySponsor(req, res) {
    try {
        const { sponsorId } = req.body;
        if (!sponsorId) { return res.status(400).json({ message: 'Please provide your Sponsor ID' }); }

        // Check if the Sponsor ID exists in the database
        const sponsor = await User.findOne({ mySponsorId: sponsorId });
        if (!sponsor) { return res.status(400).json({ message: 'Invalid Sponsor ID' }); }

        return res.status(200).json({ message: 'Sponsor verified successfully', sponsor: sponsor });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}


async function handleRegisterUsingLeftLink(req, res) {
    try {
        // New user details
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
        await placeInLeftSideOfTree(sponsor, newUser);
        const emailResponse = await sendEmailNotification(email, name, generatedSponsorId, password, uniqueKey);

        if (emailResponse === 'error') {
            console.error('Failed to send registration email.');
        }
        return res.status(201).json({ message: 'User registered successfully', user: newUser });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}



async function handleRegisterUsingRightLink(req, res) {
    try {
        // New user details
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
        await placeInRightSideOfTree(sponsor, newUser);
        const emailResponse = await sendEmailNotification(email, name, generatedSponsorId, password, uniqueKey);

        if (emailResponse === 'error') {
            console.error('Failed to send registration email.');
        }

        return res.status(201).json({ message: 'User registered successfully', user: newUser });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}



// 5. Login user
async function handleLoginUser(req, res) {
    try {
        const { sponsorId, password } = req.body;
        if (!sponsorId || !password) { return res.status(400).json({ message: 'Please enter both sponsorId and password' }); }

        // Check user exists OR not
        let user = await User.findOne({ mySponsorId: sponsorId });
        if (!user) { return res.status(404).json({ message: 'User not found' }); }


        const isPasswordMatch = await user.comparePassword(password);
        if (isPasswordMatch) {
            const payload = { email: user.email, id: user._id, role: 'user' };
            const token = generateToken(payload);
            return res.status(200).json({ token, user });
        } else {
            return res.status(404).json({ message: 'Incorrect userId OR password.' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}



// 8. Get all sponsor's children with tree-like structure, upto level 4
async function handleGetSponsorChildrens(req, res) {
    try {
        // Find sponsor
        const sponsor = await User.findOne({ _id: req.params.id });
        if (!sponsor) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Build the tree
        const tree = await buildTree(sponsor);

        // Return the tree
        return res.status(200).json(tree);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}




// helper Recursive function to build the binary tree structure up to level 4
async function buildTree(user, level = 1) {
    if (!user || level > 4) return null; // Base case: If no user or level > 4, return null

    const userNode = {
        _id: user._id,
        value: user.name,
        mySponsorId: user.mySponsorId,
        isActive: user.isActive,
        leftChild: null,
        rightChild: null
    };

    // Only fetch left and right children if the current level is less than 4
    if (level < 4) {
        if (user.binaryPosition && user.binaryPosition.left) {
            const leftChild = await User.findById(user.binaryPosition.left);
            userNode.leftChild = await buildTree(leftChild, level + 1);
        }

        if (user.binaryPosition && user.binaryPosition.right) {
            const rightChild = await User.findById(user.binaryPosition.right);
            userNode.rightChild = await buildTree(rightChild, level + 1);
        }
    }

    return userNode;
}

// 9. Handle extremeLeft 
async function handleExtremeLeft(req, res) {
    try {
        const { sponsorId } = req.body;
        console.log(sponsorId);
        
        if(!sponsorId) { return res.status(404).json({ message: "Please provide sponsor ID." }); }

        // Find the sponsor
        const user = await User.findOne({mySponsorId: sponsorId});
        if (!user) { return res.status(404).json({ message: 'Invalid SponsorId.' }); }

        // Find the extreme left user
        const extremeLeftUser = await findExtremeLeft(user);
        
        // Build the tree
        const tree = await buildTree(extremeLeftUser);
        return res.status(200).json(tree);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

// helper function to find extreme left user
async function findExtremeLeft(user) {
    
    // Base case: If no left child or no binary position, return the current user
    if (!user.binaryPosition || !user.binaryPosition.left) return user; 

    // Recursively call the function for the left child
    const leftChild = await User.findById(user.binaryPosition.left);
    return await findExtremeLeft(leftChild);
}

// 10. Handle extremeRight
async function handleExtremeRight(req, res) {
    try {
        const { sponsorId } = req.body;
        if(!sponsorId) { return res.status(404).json({ message: "Please provide sponsor ID." }); }

        // Find the sponsor
        const user = await User.findOne({mySponsorId: sponsorId});
        if (!user) { return res.status(404).json({ message: 'User not found' }); }

        // Find the extreme right user
        const extremeRightUser = await findExtremeRight(user);
        
        // Build the tree
        const tree = await buildTree(extremeRightUser);
        return res.status(200).json(tree);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

// helper function to find extreme right user
async function findExtremeRight(user) {
    
    // Base case: If no left child or no binary position, return the current user
    if (!user.binaryPosition || !user.binaryPosition.right) return user; 

    // Recursively call the function for the left child
    const rightChild = await User.findById(user.binaryPosition.right);
    return await findExtremeRight(rightChild);
}

module.exports = {
    handleRegisterFirstUser,
    handleRegisterUser,
    handleRegisterUsingLeftLink,
    handleRegisterUsingRightLink,
    handleLoginUser,
    handleGetSponsorChildrens,
    handleVerifySponsor,
    handleExtremeLeft,
    handleExtremeRight

};