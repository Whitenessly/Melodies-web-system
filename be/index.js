import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Import routes
import authRoutes from './routes/authRoutes.js';
import songRoutes from './routes/songRoutes.js';
import albumRoutes from './routes/albumRoutes.js';
import playlistRoutes from './routes/playlistRoutes.js';
import userRoutes from './routes/userRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import promotionRoutes from './routes/promotionRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();
const PORT = process.env.PORT || 8080;

mongoose.connect('mongodb://localhost:27017/melodies')
    .then(() => console.log('Connected to database successfully'))
    .catch((err) => console.log('Error connecting to database', err));

const app = express();

app.use(cors());
// Configure body limit to allow base64 uploads (up to 50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/admin', adminRoutes);

// Root message
app.get('/', (req, res) => {
    res.json({
        message: 'Melodies Web System API is running...',
        status: 'online'
    });
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});