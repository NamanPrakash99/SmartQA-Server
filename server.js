require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const roomRoutes = require('./src/routes/roomRoutes');

const app = express(); // Create instance of express to setup the server

// Middlewares
app.use(express.json());

mongoose.connect(process.env.MONGODB_URL)
    .then(() => console.log('MongoDB Connected'))
    .catch((error) => console.log('Error connecting to DB', error));

const corsConfig = {
    origin: process.env.CLIENT_URL,
    credentials: true
};
app.use(cors(corsConfig));

app.use('/room', roomRoutes);

// Start the server
const PORT = process.env.PORT;
app.listen(PORT, (error) => {
    if (error) {
        console.log('Server not started due to: ', error);
    } else {
        console.log(`Server running at port: ${PORT}`)
    }
});