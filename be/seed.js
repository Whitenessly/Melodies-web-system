import mongoose from 'mongoose';
import User from './models/User.js';
import Song from './models/Song.js';
import Album from './models/Album.js';
import { hashPassword } from './utils/token.js';

const MONGO_URI = 'mongodb://localhost:27017/melodies';

const songsData = [
  {
    title: 'Midnight Pulse',
    artist: 'Neon Velocity',
    genre: 'Electronic',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDRVpNqEpxAk0KEIYeIq4yxZgWI30NOSArhCYQiabzPJICZ7iPrm78R72VGmfqqUrzpWgvthJGjfUwcvnpersFzJQ1fwtxAbflG18-hjvoLqz7WOQumXWp42t8_OfvnQcnRAiNM82TwvpFeO0fjPhJUOUwbpktJWk7aI_8gXJOdUF0N4B6sJ4MBFR6Q6HHO8ONkDgxMrTu9sTIuMYk3f8G7tNG2P11X9iJTIQInWRGO9hcMwG17ae-yai7vBg7U4J4HIeTrofmMZls',
    views: 12000,
    likes: 450,
    lyrics: 'Cruising through the neon haze\nLost inside a digital maze\nMidnight pulse is taking control\nElectronic beats inside my soul'
  },
  {
    title: 'Concrete Jungle',
    artist: 'The Architects',
    genre: 'Brutalist',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZHCmC7sLG1sTUZS89t6JCevgpptR3BBMpJxe_R7Fo5jqR3yrHGFI2unIB85L6bxtjzsu2IMTLwXb0lk0XIRJEiwb6lvuHhEM8eH6YJrzT5fFh2xPiyshFF8fYPGfpqVZb2c363i2ROrd4fPr2WjJx1Am9mefqa3VVTUyKBtG-A0GrX5NxeMbq9FXHL6tNesawHHg9ST4YI68kl55y3k9uTqLogMzL6BzS7NjwClcrVErahqbvnla83yxK_SiehG4fIQFPVaZUNuw',
    views: 8500,
    likes: 320,
    lyrics: 'Concrete shadows rise so high\nGrey structures touch the sky\nUrban noise and cold design\nWalking on a brutalist line'
  },
  {
    title: 'Vapor Wave',
    artist: 'Digital Muse',
    genre: 'Retro-synth',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9mti9MIp1MWyYaKUNA8Lv8RpyUErxQ_U6LFyyy4MaqPB7RejArdckTwFNRa_1LfNZFiG7JR0cSlr1CVCvLCk-F2ihpNisCfyRGV-VrMND_v10pFc8gsbB0oypT0wmfxJjIBgOmYqsCN-IN9N7bspUp7tPkrFz5JRhWeFQOPtRjYLSbVno_KHBIq_BFTbX0ZQlGRkEZcwedT7uzCi1Y568oV9mR-ShAI6rq9ppbUUPBgu56sLy5mJLjf_8Mz5EHXhWYrGh_2VAPdw',
    views: 15400,
    likes: 680,
    lyrics: 'Aesthetic dreams from 89\nPurple waves and VHS time\nAnalog heart beats in the code\nCruising down the vapor road'
  },
  {
    title: 'Thanh Xuân',
    artist: 'Da LAB',
    genre: 'V-Pop',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCj1wRqcxoWgGABM80uRstMtKhhCBddaUE_RbkO_DBjR9pTV8XdTR0feMbU9O_jEQ6PVfPeSUmjgHGp3qaeT5FTawrdDe8eBGfEWCJEVba36NDwFaOkXOJ6PRd1fHBXkwaFx_waDjR6n1HYx5_w9oNWkInyNLXXyiweN4tW33NfwetA6cPg_cAdUrsrfT7UH1jfw7ouEok1brTP8aqfB7Kvk74lCClAuNteUKwGjMGI8wrPj0fn9C1kt5A6WSA1arvWnZOxrE_hmLQ',
    views: 45000,
    likes: 2300,
    lyrics: 'Hôm nay ta cùng nhau già đi...\nThanh xuân như một tách trà\nNhâm nhi một chút thôi\nĐã vơi đi nửa đời người'
  },
  {
    title: 'Đêm Trăng Tròn',
    artist: 'Sơn Tùng M-TP',
    genre: 'V-Pop',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3IbPePH6sY9PuMnx2jhSfT-dbC8T7vHIxYM-U3gRBjKpDqHfpgHQF0Yb3I9SE3fqSpLIwO7JNqv1_icF4OcmQHyzNRk0Xwis_lC6iJ_SwzoR78k24s2tmJPK2gplIuIQ2PzJwgVm0wB-i-2uEVjpsKG7yAcFAp0XdSVzRn3Dpa7dGDMXxXOToH9OSFWoMwqZ26hcC0t4GYkRf6nHNciGlsgxDZNi-JMJ6VAUnXt8iX0Of0HD8-jzaJwSIDlTIg5V5qnor3wMOQ84',
    views: 95000,
    likes: 8500,
    lyrics: 'Ánh trăng vàng chiếu soi đêm đen\nDưới bóng đêm anh nhớ về em\nĐêm trăng tròn sáng lung linh\nNhư tình yêu của đôi mình'
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to database for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Song.deleteMany({});
    await Album.deleteMany({});
    console.log('Cleared existing database entries.');

    // Create Users
    const adminPass = hashPassword('Password123');
    const admin = new User({
      name: 'Melodies Admin',
      email: 'admin@melodies.com',
      password: adminPass,
      role: 'admin'
    });
    await admin.save();

    const artistPass = hashPassword('Password123');
    const artist = new User({
      name: 'Alex Rivers',
      email: 'artist@melodies.com',
      password: artistPass,
      role: 'artist'
    });
    await artist.save();

    const listenerPass = hashPassword('Password123');
    const listener = new User({
      name: 'Wesley Listener',
      email: 'listener@melodies.com',
      password: listenerPass,
      role: 'listener'
    });
    await listener.save();
    console.log('Seeded core users (Admin, Artist, Listener).');

    // Create Songs linked to Artist
    const songsToInsert = songsData.map(song => ({
      ...song,
      artistId: artist._id
    }));
    
    const dbSongs = await Song.insertMany(songsToInsert);
    console.log(`Seeded ${dbSongs.length} mockup songs.`);

    // Create an Album and link songs
    const album = new Album({
      title: 'Neon Nights',
      artist: 'Alex Rivers',
      artistId: artist._id,
      genre: 'Electronic',
      thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAcrwyDw9NGZCIjKIpGpHWFGHBTwXcuQ_Ljf5jrgENKGxknt0YgEKpTY62-qsRFOZkYI_54oLS1FHOrGc3DVanYeuTpBGdAfZSiJA5-lUX_m9g7tqiGi6t7VD2AXpqydzBpS9c3SVHp7R4Sq9nOLghWOSS1AAJGbhR5FHAgZ6myuBC2P62vMRNU2jPTczDAOGCrdfjgfjLYkzTMttSrxxt-kLfn9p6_qW4Efs4J6Sq5mME_6FnXI1VZh5suradCwi--ZxT4v4qqBOw',
      songs: [dbSongs[0]._id, dbSongs[1]._id]
    });
    await album.save();

    // Update songs with albumId
    await Song.updateMany(
      { _id: { $in: [dbSongs[0]._id, dbSongs[1]._id] } },
      { albumId: album._id }
    );
    console.log('Seeded mockup album.');

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
