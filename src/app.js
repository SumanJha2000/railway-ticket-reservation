const express = require('express');
const app = express();
require('dotenv').config();

app.use(express.json());
app.use('/api/v1/tickets', require('./routes/ticketRoutes.js'));

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});
