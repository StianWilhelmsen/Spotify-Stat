import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import axios from 'axios';
import '../styling/Homepage.css';

function getCurrentSong(accessToken, setCurrentSong, setCurrentPicture, setCurrentArtists, setSongDuration, setPlayedDuration, setProgressBar, setIsPlaying) {
    axios.get('https://api.spotify.com/v1/me/player/', {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    }).then(response => {
            if(response.data == "") {
                setCurrentSong("No song is being played")
                setPlayedDuration("00:00")
                setSongDuration("00:00")
            } else {
                setCurrentSong(response.data.item.name)
                setCurrentPicture(response.data.item.album.images[0].url)
                setCurrentArtists(response.data.item.album.artists[0].name)
                setIsPlaying(true)

                const playedDurationValue = convertMsToMinutesAndSeconds(response.data.progress_ms);
                const songDurationValue = convertMsToMinutesAndSeconds(response.data.item.duration_ms);
                
                setPlayedDuration(playedDurationValue);
                setSongDuration(songDurationValue);
                
                const playedSeconds = durationToSeconds(playedDurationValue);
                const totalSeconds = durationToSeconds(songDurationValue);
                setProgressBar((playedSeconds / totalSeconds) * 100);
            }
        console.log(response);
    }, error => {
        console.log(error);
    })
}

function getUsersTopTracks(accessToken, setTopTracks) {
    axios.get('https://api.spotify.com/v1/me/top/tracks?time_range=short_term', {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    }).then(response => {
        setTopTracks(response.data.items.slice(0, 5));
    }, error => {
        console.log(error);
    })
}

function getUsersTopArtists(accessToken, setTopArtists) {
    axios.get('https://api.spotify.com/v1/me/top/artists?time_range=short_term', {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    }).then(response => {
        console.log(response);
        setTopArtists(response.data.items.slice(0, 10));
    }, error => {
        console.log(error);
    })
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function convertMsToMinutesAndSeconds(ms) {
        let minutes = Math.floor(ms / 60000);
        let seconds = ((ms % 60000) / 1000).toFixed(0);
        return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}

function durationToSeconds(duration) {
    const [minutes, seconds] = duration.split(':').map(Number)
    return minutes * 60 + seconds;
}

async function startPlayback(accessToken, setIsPlaying, isPlaying) {
    try {
        const response = await axios.put('https://api.spotify.com/v1/me/player/play', {}, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        console.log(response);
        setIsPlaying(true); // Set isPlaying to true
        console.log(isPlaying)
    } catch (error) {
        console.log(error);
    }
}

function pausePlayback(accessToken, setIsPlaying) {
        axios.put('https://api.spotify.com/v1/me/player/pause', {}, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
    }).then(response => {
        setIsPlaying(false)
        console.log(response)
    }, error => {
        console.log(error)
    })
}

function Homepage({ accessToken }) {
    const [userName, setUserName] = useState('');
    const [profilePic, setProfilePic] = useState('');
    const [email, setEmail] = useState('');
    const [followers, setFollowers] = useState('');
    const [product, setProduct] = useState('');
    const [topTracks, setTopTracks] = useState([]);
    const [currentSong, setCurrentSong] = useState('');
    const [currentPicture, setCurrentPicture] = useState('');
    const [currentArtist, setCurrentArtists] = useState('');
    const [topArtists, setTopArtists] = useState([]);
    const [songDuration, setSongDuration] = useState('');
    const [playedDuration, setPlayedDuration] = useState('');
    const [progressBar, setProgressBar] = useState('');
    const [intervalId, setIntervalId] = useState(null);
    const [isPlaying, setIsPlaying] = useState(Boolean)

    useEffect(() => {
        if (!accessToken) return;
        localStorage.setItem('accessToken', accessToken);

        axios.get('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        }).then(response => {
            setUserName(response.data.display_name);
            setEmail(response.data.email)
            setFollowers(response.data.followers.total)
            setProduct(capitalizeFirstLetter(response.data.product))

            if (response.data.images && response.data.images.length > 0) {
                setProfilePic(response.data.images[0].url);
            }
        }, error => {
            console.log(error);
        })

        getCurrentSong(accessToken, setCurrentSong, setCurrentPicture, setCurrentArtists, setSongDuration, setPlayedDuration, setProgressBar, setIsPlaying);
    }, [accessToken]);

    useEffect(() => {
        return () => clearInterval(intervalId);
    }, [currentSong, songDuration, isPlaying]); 
    

    //Updates the progressbar
    useEffect(() => {
        const updateProgressBar = () => {
            setPlayedDuration(prevDuration => {
                const newPlayedSeconds = durationToSeconds(prevDuration) + 1;
                const totalSeconds = durationToSeconds(songDuration)

                if (newPlayedSeconds === totalSeconds) {
                    getCurrentSong(accessToken, setCurrentSong, setCurrentPicture, setCurrentArtists, setSongDuration, setPlayedDuration, setProgressBar, setIsPlaying)

                } else {
                    const newProgressBar = (newPlayedSeconds / totalSeconds) * 100;

                    setProgressBar(newProgressBar);
    
                    return convertMsToMinutesAndSeconds(newPlayedSeconds * 1000)
    
                }
            });
        };

        if (!isPlaying) {
            return;
        }


        if (currentSong && !intervalId) {
            if(playedDuration === "00:00") {
                return
            } else {

                    const newIntervalId = setInterval(updateProgressBar, 1000)
                    setIntervalId(newIntervalId);
            }
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
                setIntervalId(null);
            }
        };

    }, [currentSong, songDuration])

    return (
        <div>
            <div className='homepage-wrapper'>
                <div className='user-wrapper'>
                    <div className='user-info'>
                        {profilePic && <img src={profilePic} alt='ProfilePicture' style={{ width: 100 }} />}
                        <p id='username'>{userName}</p>
                        <p className='sub-title'>{email}</p>
                        <p className='sub-title'>Followers: {followers}</p>
                        <p className='sub-title'>Product: {product}</p>
                    </div>

                    <div className='currently-playing-div'>
                        <h4>Currently playing:</h4>
                        <div className="current-song">
                            <img src={currentPicture} alt="Album Cover" style={{ width: 200, height: 200 }} />
                            <div className='song-duration-info'>
                                <p>{playedDuration}</p>
                                <div className='progress-bar-container'>
                                    <div className='progress-bar' style={{ width: `${progressBar}%` }}></div>
                                </div>
                                <p>{songDuration}</p>
                            </div>
                            <div className='song-name-info'>
                                <p id='current-song'>{currentSong}</p>
                                <p id='current-artist'>{currentArtist}</p>
                            </div>

                            <div className='player-controller'>
                                <button id='controller-button'>
                                    <i className='fas fa-step-backward'></i>
                                </button>
                                {!isPlaying && (
                                    <button
                                        id='controller-button'
                                        onClick={() => {
                                            startPlayback(accessToken, setIsPlaying, isPlaying);
                                            getCurrentSong(accessToken, setCurrentSong, setCurrentPicture, setCurrentArtists, setSongDuration, setPlayedDuration, setProgressBar, setIsPlaying);
                                        }}
                                    >
                                        <i className='fas fa-play'></i>
                                    </button>
                                )}
                                {isPlaying && (<button id='controller-button' onClick={() => pausePlayback(accessToken, setIsPlaying)}>
                                    <i className='fas fa-pause'></i>
                                </button>
                                )}
                                <button id='controller-button'>
                                    <i className='fas fa-step-forward'></i>
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

                <div className='interactive-wrapper'>
                    <div className='header-interactive-section'>
                        <h1 className='interactive-header-title'>Explore Your Account</h1>
                    </div>

                    

                    <div className='tracks-artists-interactive-section'>
                        <div className="top-tracks">
                            <h2 id='interactive-sub-title'>Top Tracks</h2>
                            <ul>
                                {topTracks.map((track, index) => (
                                    <li className='tracks-list' key={index} style={{ animationDelay: `${index * 0.5}s` }}>
                                        <span style={{ marginRight: 10 }}>{index + 1}.</span>
                                        <img src={track.album.images[0].url} alt="Album Cover" style={{ width: 50, height: 50, marginRight: 10 }} />
                                        <span> - {track.name} by {track.artists.map(artist => artist.name).join(', ')}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className='centered-btn-div'>
                                <button onClick={() => getUsersTopTracks(accessToken, setTopTracks)}>Get Top Tracks</button>
                            </div>
                        </div>

                        <div className='top-artists'>
                            <h2 id='interactive-sub-title'>Top Artists</h2>
                            <ul>
                                {topArtists.map((artist, index) => (
                                    <li className='artists-list' key={index} style={{ animationDelay: `${index * 0.5}s` }}>
                                        <span style={{ marginRight: 10 }}>{index + 1}.</span>
                                        <img src={artist.images[0].url} alt="Artist Image" style={{ width: 50, height: 50, marginRight: 10 }} />
                                        <span> - {artist.name}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className='centered-btn-div'>
                                <button onClick={() => getUsersTopArtists(accessToken, setTopArtists)}>Get Top Artists</button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default Homepage;