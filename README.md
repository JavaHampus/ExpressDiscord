# ExpressDiscord
Discord OAuth2 package. Makes it easy to create a session for an express server to allow users to sign in using Discord.

## Installation
```shell
npm i @javahampus/expressdiscord@1.0.0
```

## Usage
```js
import { DiscordExpress } from 'discordexpress'

import bodyParser from 'body-parser';
import session from 'express-session';

import express from 'express';
const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(session({
    secret: 'javahampus npm package',
    resave: false,
    saveUninitialized: true,
}))

const discordExpress = new DiscordExpress({clientId: 'CLIENT_ID'}, {clientSecret: 'CLIENT_SECRET'}, {redirectUri: 'http://localhost/discord/callback'}, {scope: ['identify', 'guilds']});

app.get('/', (req, res) => {
    if(!req.session.user) {
        res.redirect('/discord')
    } else {
        res.send(`Hello ${req.session.user.username}`);
    }
})

app.get('/discord', (req, res) => {
    res.redirect(discordExpress.redirectAuthoization());
})

app.get('/discord/callback', async (req, res) => {
    discordExpress.startAuthoization(req, res, '/testing');
})

app.get('/testing', (req, res) => {
    res.send(req.session.user.username);
})

app.listen(80, () => console.log("Express Server is online!"));
```
