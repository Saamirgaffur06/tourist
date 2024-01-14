const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const port = 3000;

// Serve static files from the "public" directory
app.use(express.static('public'));

mongoose.connect('mongodb://127.0.0.1:27017/placesApp', { useNewUrlParser: true, useUnifiedTopology: true });

const placeSchema = new mongoose.Schema({
    name: String,
    liked: Boolean,
    likes: Number,
});

const Place = mongoose.model('Place', placeSchema);

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
});

const User = mongoose.model('User', userSchema);

app.use(bodyParser.json());

// Registration endpoint
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if the username is already taken
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username is already taken' });
        }

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        res.json({ message: 'Registration successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Server-side code for handling login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (user) {
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (passwordMatch) {
                // Authentication successful
                // Redirect to the start page (make sure startpage.html is in the "public" directory)
                res.sendFile(path.join(__dirname, 'public', 'startpage.html'));
            } else {
                // Authentication failed
                res.status(401).json({ error: 'Incorrect username or password' });
            }
        } else {
            // Authentication failed
            res.status(401).json({ error: 'Incorrect username or password' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Endpoint for liking places
app.post('/api/like-place', async (req, res) => {
    try {
        const { name, liked } = req.body;

        if (!name || liked === undefined) {
            return res.status(400).json({ error: 'Invalid request data' });
        }

        let place = await Place.findOne({ name });

        if (!place) {
            place = new Place({ name, liked, likes: 0 });
        }

        if (liked) {
            if (!place.liked) {
                place.liked = true;
                place.likes++;
            }
        } else {
            if (place.liked) {
                place.liked = false;
                place.likes--;
            }
        }

        await place.save();

        res.json({ message: 'Place like status updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
