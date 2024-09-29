import React, { useState, useEffect } from 'react';
import './styling/Global.css';
import Homepage from './pages/Homepage';
import axios from 'axios';

function generateRandomString(length) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

function App() {
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (code) {
      exchangeCodeForToken(code);
    }
  }, []);

  const exchangeCodeForToken = async (code) => {
    const client_id = 'CLIENT_ID'; //Users has to get their own client id and secret from Spotify API
    const client_secret = 'CLIENT_SECRET'; 
    const redirect_uri = 'http://localhost:3000'; 
  
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirect_uri,
    });
  
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(client_id + ':' + client_secret)}`, // Encoding client ID and secret
    };
  
    try {
  
      const response = await axios.post('https://accounts.spotify.com/api/token', params, { headers });
  
      setAccessToken(response.data.access_token);
    } catch (error) {
      console.error('Error during token exchange', error);
    }
  };

  const handleLogin = () => {
    const client_id = '84611cdc1da44b329b13f1b61af85846'; 
    const redirect_uri = 'http://localhost:3000'; 
    const scope = 'user-read-private user-read-email user-top-read user-read-currently-playing user-read-playback-state user-modify-playback-state';
    const state = generateRandomString(16);

    const authUrl = `https://accounts.spotify.com/authorize?${new URLSearchParams({
      response_type: 'code',
      client_id,
      scope,
      redirect_uri,
      state,
    }).toString()}`;

    window.location.href = authUrl;
  };

  if (accessToken) {
    return <Homepage accessToken={accessToken} />;
  }

  return (
    <div>
      <button id="login-button" onClick={handleLogin}>Login with Spotify</button>
    </div>
  );
}

export default App;
