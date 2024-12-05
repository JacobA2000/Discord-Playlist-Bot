
//TODO ADD REFRESH TOKEN HANDLING

const { spotifyClientId, spotifyClientSecret, spotifyRedirectURI, spotifyPlaylistId, port} = require('./config.json');
const express = require('express');
const querystring = require('querystring');
const fetch = require('node-fetch');

const app = express();

let access_token = "";

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/login', (req, res) => {
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
    access_token = data.access_token;
    refresh_token = data.refresh_token

    res.send(`Access token received: ${access_token}`);
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
    await fetchNewAccessToken();
    scheduleTokenRefresh(); // Schedule the next refresh
  }, interval);
}

async function fetchNewAccessToken() {
  const postData = querystring.stringify({
    grant_type: 'refresh_token',
    refresh_token: refresh_token,
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
    access_token = data.access_token;
    console.log(`New access token received: ${access_token}`);
  } catch (error) {
    console.error(`Error refreshing access token: ${error.message}`);
  }
}

async function addTrackToPlaylist(track_uri) { 
    const url = `https://api.spotify.com/v1/playlists/${spotifyPlaylistId}/tracks`; 
    const bodyData = JSON.stringify({ 
        uris: [track_uri], 
    });
    try { 
        const response = await fetch(url, { 
            method: 'POST', 
            headers: { 
                'Authorization': `Bearer ${access_token}`, 
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

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

module.exports.addTrackToPlaylist = addTrackToPlaylist;