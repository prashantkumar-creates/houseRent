// require('dotenv').config();
// const express = require('express');
// const connectDB = require('./config/db');

// const app = express();

// // Connect to MongoDB
// connectDB();

// // Middleware
// app.use(express.json());

// // Routes
// app.use('/api/realestate', require('./routes/realEstateRoutes'));
// app.use('/api/maids', require('./routes/maidRoutes'));

// // Start the server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//     console.log(Server running on port ${PORT});
// });

const express = require('express');
const path = require('path');
const connectDB = require('./config/db');
const { body, validationResult } = require('express-validator');
const bodyParser = require('body-parser');

const fs = require('fs');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const dataFilePath = path.join(__dirname, 'user.json');


// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());

// Serve static files from the 'frontendrev' directory
app.use(express.static(path.join(__dirname, 'frontendrev')));

// Serve static files (CSS, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));

const readUsersFromFile = () => {
    if (!fs.existsSync(dataFilePath)) {
        fs.writeFileSync(dataFilePath, JSON.stringify([], null, 2));
    }
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data);
};

// Function to write users to data.json
const writeUsersToFile = (users) => {
    fs.writeFileSync(dataFilePath, JSON.stringify(users, null, 2));
};

// Route to serve the login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Login.html'));
});


app.post('/login', [
    body('email').isEmail(),
    body('password').isLength({ min: 6 })
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: ['Invalid email or password'] });
    }

    const { email, password } = req.body;
    const users = readUsersFromFile();
    const user = users.find(u => u.email === email);

    if (!user || user.password !== password) {
        // return res.status(400).json({ errors: ['Invalid email or password'] });
        res.send("Invalid email or password");
    }

    // res.send('Login successful');
    res.redirect("/");

});


// Route to serve the signup page
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'SignUp.html'));
});

app.post('/signup', [
    body('name').notEmpty().withMessage('Name is required'),
    body('phone').isMobilePhone().withMessage('Enter a valid phone number'),
    body('email').isEmail().withMessage('Enter a valid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords do not match');
        }
        return true;
    }),
    body('email').custom((value) => {
        const users = readUsersFromFile();
        const user = users.find(u => u.email === value);
        if (user) {
            throw new Error('Email already in use');
        }
        return true;
    })
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Join all error messages into a single string
        const errorString = errors.array().map(error => error.msg).join(', ');
        return res.send(`Error: ${errorString}`);
    }

    const { name, phone, email, password } = req.body;
    const users = readUsersFromFile();

    // Add the new user to the "database"
    users.push({ name, phone, email, password });
    writeUsersToFile(users);

    res.redirect("/login");
    
}
);

// Route to serve frontpage.html as the landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontendrev/frontpage.html'));
});

app.post('/add', (req, res) => {
    const obj = req.body;

    // Append the obj to .json by fs
    fs.readFile('./data.json', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return;
        }
        
        if (!data) {
            fs.writeFile('./data.json', JSON.stringify([obj], null, 2), (err) => {
                if (err) {
                    console.error(err);
                    return;
                }

                res.json(obj);
            });
            return;
        }

        const properties = JSON.parse(data);
        properties.push(obj);

        fs.writeFile('./data.json', JSON.stringify(properties, null, 2), (err) => {
            if (err) {
                console.error(err);
                return;
            }

            res.json(obj);
        });
    });
})

app.get('/get', (req, res) => {
    fs.readFile('./data.json', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return;
        }

        console.log(data);
        res.json(JSON.parse(data));
    });
})

// Routes
app.use('/api/realestate', require('./routes/realEstateRoutes'));
app.use('/api/maids', require('./routes/maidRoutes'));



app.post('/login', [
    body('email').isEmail(),
    body('password').isLength({ min: 6 })
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: ['Invalid email or password'] });
    }

    const { email, password } = req.body;
    const users = readUsersFromFile();
    const user = users.find(u => u.email === email);

    if (!user || user.password !== password) {
        // return res.status(400).json({ errors: ['Invalid email or password'] });
        res.send("Invalid email or password");
    }

    res.send('Login successful');
});

//payment api 

const razorpay = new Razorpay({
    key_id: 'YOUR_RAZORPAY_KEY_ID',
    key_secret: 'YOUR_RAZORPAY_KEY_SECRET'
});

app.post('/create-order', async (req, res) => {
    const options = {
        amount: req.body.amount, 
        currency: "INR",
        receipt: "receipt#1"
    };
    try {
        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        res.status(500).send(error);
    }
});


// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


