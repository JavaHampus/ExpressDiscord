import FormData from "form-data";
import fetch from "node-fetch";

export class DiscordExpress {
    private clientId: string;
    private clientSecret: string;
    private redirectUri: string;
    private scope: string[];

    constructor
    (
        {clientId}: {clientId: string}, 
        {clientSecret}: {clientSecret: string}, 
        {redirectUri}: {redirectUri: string},
        {scope}: {scope: string[]}
    ) {
        if(!clientId) throw new Error("clientId is required");
        if(!clientSecret) throw new Error("clientSecret is required");
        if(!redirectUri) throw new Error("redirectUri is required");
        if(!scope) throw new Error("scope is required");

        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.redirectUri = redirectUri;
        this.scope = scope;
    }

    /**
     * 
     * @param req Express.Request
     * @param res Express.Response
     * @param route Route to redirect user to
     * @returns Authorizes user and redirects to route
     */
    public startAuthoization = (req, res, route) => {
        const accessCode = req.query.code;
        if(!accessCode) return res.send('No access code was provided!');

        const data = new FormData()
        data.append('client_id', this.clientId);
        data.append('client_secret', this.clientSecret);
        data.append('grant_type', 'authorization_code');
        data.append('redirect_uri', this.redirectUri);
        data.append('scope', this.scope.join(' '));
        data.append('code', accessCode);

        fetch('https://discordapp.com/api/oauth2/token', {
            method: 'POST',
            body: data
        }).then(response => {
            response.json().then(json => {
                fetch('https://discordapp.com/api/users/@me', {
                    headers: {
                        Authorization: `${json['token_type']} ${json['access_token']}`
                    }
                }).then(response => {
                    response.json().then(json => {
                        req.session.user = json;

                        req.session.save();

                        res.redirect(route)
                    })
                })
            })
        })
    }

    /**
     * 
     * @param req Express.Request
     * @param res Express.Response
     * @param route Route to redirect user to
     * @returns Destroys session and redirects to route
     */
    public signOut = (req, res, route) => {
        req.session.destroy();
        res.redirect(route);
    }

    /**
     * 
     * @returns URL to redirect user to
     */
    public redirectAuthoization = () => {
        return `https://discordapp.com/api/oauth2/authorize?client_id=${this.clientId}&redirect_uri=${encodeURIComponent(this.redirectUri)}&response_type=code&scope=${this.scope.join('%20')}`
    }
}

import bodyParser from 'body-parser';
import session from 'express-session';

import express from 'express';
const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
}))

const discordExpress = new DiscordExpress({clientId: '910629582649065512'}, {clientSecret: 'NLdR6GqSyeNdyxMlIlj4c1DhqohuBSvE'}, {redirectUri: 'http://localhost/discord/callback'}, {scope: ['identify', 'guilds']});

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

app.listen(80, () => console.log("Testing NPM Package!"));