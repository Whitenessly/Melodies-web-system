import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const PORT = process.env.PORT || 8080;

mongoose.connect('mongodb://localhost:27017/')
    .then(() => console.log('Connected to database successfully'))
    .catch((err) => console.log('Error connecting to database', err));
const app = express();
app.use(cors());
app.use(express.json());

app.use('/', (req, res) => {
    res.json({
        message: 'Server is running...',
        data: null
    });
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});