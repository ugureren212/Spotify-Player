require("dotenv").config()

const { Console } = require("console");
const express = require("express");
const lyricsFinder = require("lyrics-finder")
const cors = require("cors")
const bodyParser = require("body-parser");
const { allowedNodeEnvironmentFlags } = require("process");
//module thats makes using the spotify API easier
const spotifyWebApi = require("spotify-web-api-node");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))

//refreshes token by sending refresh token for a new access token
app.post("/refresh", (req, res) => {
  const refreshToken = req.body.refreshToken;
  const spotifyApi = new spotifyWebApi ({
    redirectUri: process.env.REDIRECT_URI,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken
  })  

  // clientId, clientSecret and refreshToken has been set on the api object previous to this call.
  spotifyApi.refreshAccessToken()
    .then(data => {
      console.log('--------The access token has been refreshed!--------')
      res.json({
        accessToken: data.body.accessToken,
        expiresIn: data.body.expiresIn,
      })
    }).catch((err)=> {
      console.log(err)
      res.sendStatus(400)
    })
})

//creates a new access token for spoitfy API
app.post("/login", (req, res) => {
    const code = req.body.code
    const spotifyApi = new spotifyWebApi ({
      redirectUri: process.env.REDIRECT_URI,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
    })

    //recieves data once access code is authorised
    spotifyApi.authorizationCodeGrant(code)
    .then(data => {
      res.json({
        accessToken: data.body.access_token,
        refreshToken: data.body.refresh_token,
        expiresIn: data.body.expires_in,
      })
    })
    .catch( err => {
      console.log("code grant did not work ", err)
      res.sendStatus(400)
    })

})

//simple module used to find lyrics for a track
app.get("/lyrics", async (req, res) => {
  const lyrics = (await lyricsFinder(req.query.artist, req.query.track)) || "No Lyrics Found"
  res.json({ lyrics })
})

app.listen(3001)
