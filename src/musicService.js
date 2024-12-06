const configJSON = require('./config.json');
const { 
  spotifyClientId, 
  spotifyClientSecret, 
  spotifyRedirectURI, 
  spotifyPlaylistId,
  spotifyRefreshToken,
  ytClientId,
  ytClientSecret,
  ytRedirectURI,
  ytPlaylistId,
  ytRefreshToken,
  port
} = configJSON;

const express = require('express');
const querystring = require('querystring');
const fetch = require('node-fetch');
const fs = require('node:fs');

const app = express();

let spotifyAccessToken = "";
let spotifyRToken = spotifyRefreshToken;
let ytAccessToken = "";
let ytRToken = ytRefreshToken;

fetchNewAccessToken(
  service = 'spotify',
  authUrl = 'https://accounts.spotify.com/api/token', 
  refreshToken = spotifyRToken, 
  clientId = spotifyClientId, 
  clientSecret = spotifyClientSecret
);

fetchNewAccessToken(
  service = 'yt',
  authUrl = 'https://oauth2.googleapis.com/token', 
  refreshToken = ytRToken, 
  clientId = ytClientId, 
  clientSecret = ytClientSecret
);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/spotifylogin', (req, res) => {
  const scope = 'user-read-private user-read-email playlist-modify-public';
  const queryParams = querystring.stringify({
    response_type: 'code',
    client_id: spotifyClientId,
    scope: scope,
    redirect_uri: spotifyRedirectURI,
  });
  res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`);
});

app.get('/spotifycallback', async (req, res) => {
  const code = req.query.code || null;

  const postData = querystring.stringify({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: spotifyRedirectURI,
    client_id: spotifyClientId,
    client_secret: spotifyClientSecret,
  });

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: postData,
    });

    const data = await response.json();
    spotifyAccessToken = data.access_token;
    spotifyRToken = data.refresh_token;

    configJSON.spotifyRefreshToken = spotifyRToken;
    fs.writeFileSync('src/config.json', JSON.stringify(configJSON, null, 2));

    res.send(`Authenticated with spotify`);
    // Schedule the token refresh before the access token expires 
    scheduleTokenRefresh();

  } catch (error) {
    res.send(`Error: ${error.message}`);
  }
});

app.get('/ytlogin', (req, res) => {
  const scope = 'https://www.googleapis.com/auth/youtube';
  const queryParams = querystring.stringify({
    client_id: ytClientId,
    redirect_uri: ytRedirectURI,
    response_type: 'code',
    scope: scope,
    access_type: 'offline',
    include_granted_scopes: 'true', 
    state: 'state_parameter_passthrough_value'
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${queryParams}`);
});

app.get('/ytcallback', async (req, res) => {
  const { code } = req.query;

  const postData = querystring.stringify({
    code,
    client_id: ytClientId,
    client_secret: ytClientSecret,
    redirect_uri: ytRedirectURI,
    grant_type: 'authorization_code'
  });

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: postData,
    });

    const data = await response.json(); 
    
    ytAccessToken = data.access_token;
    ytRToken = data.refresh_token;

    configJSON.ytRefreshToken = ytRToken;
    fs.writeFileSync('src/config.json', JSON.stringify(configJSON, null, 2));

    res.send(`Authenticated with youtube`);
    // Schedule the token refresh before the access token expires 
    scheduleTokenRefresh();

  } catch (error) {
    res.send(`Error: ${error.message}`);
  }
});

function scheduleTokenRefresh() {
  // Schedule to refresh the token 5 minutes before it expires
  const interval = 55 * 60 * 1000; // 55 minutes in milliseconds
  setTimeout(async () => {
    
    console.log("Running scheduled token refresh.")

    await fetchNewAccessToken(
      service = 'spotify',
      authUrl = 'https://accounts.spotify.com/api/token', 
      refreshToken = spotifyRToken, 
      clientId = spotifyClientId, 
      clientSecret = spotifyClientSecret
    );

    await fetchNewAccessToken(
      service = 'yt',
      authUrl = 'https://oauth2.googleapis.com/token', 
      refreshToken = ytRToken, 
      clientId = ytClientId, 
      clientSecret = ytClientSecret
    );

    scheduleTokenRefresh(); // Schedule the next refresh
  }, interval);
}

async function fetchNewAccessToken(service, authUrl, refreshToken, clientId, clientSecret) {
  
  console.log(`Trying to refresh ${service} token.`)

  const postData = querystring.stringify({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  try {
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: postData,
    });

    const data = await response.json();

    switch (service) {
      case "spotify":
        spotifyAccessToken = data.access_token;
        console.log(`New spotify access token received: ${spotifyAccessToken}`);
      case "yt":
        ytAccessToken = data.access_token;
        console.log(`New yt access token received: ${ytAccessToken}`);
    }
    
  } catch (error) {
    console.error(`Error refreshing access token: ${error.message}`);
  }
}

async function addTrackToSpotifyPlaylist(track_uri) { 
    const url = `https://api.spotify.com/v1/playlists/${spotifyPlaylistId}/tracks`; 
    const bodyData = JSON.stringify({ 
        uris: [track_uri], 
    });
    try { 
        const response = await fetch(url, { 
            method: 'POST', 
            headers: { 
                'Authorization': `Bearer ${spotifyAccessToken}`, 
                'Content-Type': 'application/json', 
            }, 
            body: bodyData, 
        }); 
        if (response.status === 201) { 
            console.log(`Track added to playlist successfully.`); 
        } else { 
            const errorData = await response.json(); 
            console.log(`Error adding track to playlist: ${errorData.error.message}`); 
        } 
    } catch (error) { 
        console.log(`Error: ${error.message}`);
    }
}

async function addVideoToYTPlaylist(video_id) { 
  try { 
    const accessToken = await oauth2Client.getAccessToken(); 
    const response = await fetch('https://www.googleapis.com/youtube/v3/playlistItems', {
      method: 'POST', 
      headers: { 
        Authorization: `Bearer ${accessToken.token}`, 
       'Content-Type': 'application/json', 
      }, 
      body: JSON.stringify({ 
        snippet: { 
          playlistId: ytPlaylistId, 
          resourceId: { 
            kind: 'youtube#video', 
            videoId: video_id, 
          }, 
        }, 
      }), 
    });
    
    const data = await response.json(); 
    console.log('Video added to playlist:', data); 
  } catch (error) { 
    console.error('Error adding video to playlist:', error); 
  } 
}

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

module.exports.addTrackToSpotifyPlaylist = addTrackToSpotifyPlaylist;
module.exports.addVideoToYTPlaylist = addVideoToYTPlaylist;