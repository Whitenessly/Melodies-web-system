import axios from 'axios';

async function testGenius(query) {
  try {
    const url = `https://genius.com/api/search/multi?q=${encodeURIComponent(query)}`;
    console.log('Fetching from Genius API:', url);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });
    console.log('Success!');
    const sections = response.data?.response?.sections;
    if (sections) {
      for (const sec of sections) {
        if (sec.type === 'song') {
          console.log('Songs found:', sec.hits.length);
          sec.hits.slice(0, 2).forEach(h => {
            console.log('Song title:', h.result.title);
            console.log('Artist:', h.result.artist_names);
            console.log('Lyrics URL:', h.result.url);
            console.log('Cover Image:', h.result.song_art_image_thumbnail_url);
          });
        }
      }
    }
  } catch (err) {
    console.log('Genius API failed:', err.message);
  }
}

testGenius('Imagine Dragons Believer');
