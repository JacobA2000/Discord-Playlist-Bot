const fetch = require('node-fetch');

const getTrackIds = async (url, platformToFind, userCountry = 'US', songIfSingle = true) => {
  const apiUrl = `https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(url)}&userCountry=${userCountry}&songIfSingle=${songIfSingle}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    const youtubeId = data.linksByPlatform.youtube?.entityUniqueId.split('::')[1] || 'Not found';
    const spotifyId = data.linksByPlatform.spotify?.entityUniqueId.split('::')[1] || 'Not found';

    console.log(`YouTube ID: ${youtubeId}`);
    console.log(`Spotify ID: ${spotifyId}`);

    switch (platformToFind) {
      case "spotify":
          return spotifyId;
      case "yt":
          return youtubeId;
    }

  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

module.exports.getTrackIds = getTrackIds;