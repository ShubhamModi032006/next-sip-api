require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const fundRoutes = require('./routes/funds');

const app = express();
const port = 4000; // The port your service will run on
const MONGO_URI = process.env.MONGO_URI;

// 2. Connect to MongoDB using Mongoose
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB using Mongoose!');
  })
  .catch(error => {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1); // Exit the process if the database connection fails
  });

// 3. Tell Express to use our API routes
// Any request starting with '/api' will be handled by the fundRoutes file.
// So, a request to '/api/funds' will be handled by the router we created.
app.use('/api', fundRoutes);

// 4. Start the Express server
app.listen(port, () => {
    console.log(`Fund filter service listening at http://localhost:${port}`);
});

