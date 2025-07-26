const { config } = require('dotenv');
const cors = require('cors')
const db = require('../src/config/database')
const express = require('express');
config()
const authRoutes = require('../src/router/authRotes')
const app = express();
const PORT =process.env.PORT || 3000
app.use(express.json());
app.use(cors());
app.use('/auth/api',authRoutes)
app.listen(PORT, ()=>{
    console.log(`server start host: localhost:${PORT}`)
})