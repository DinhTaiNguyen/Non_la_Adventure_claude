# Reliable worldwide online play

The game is ready for worldwide WebRTC co-op. For reliable overseas play, the deployed game needs both a public HTTPS address and a TURN relay.

## 1. Publish the complete game folder over HTTPS

Both players must open the same public website. A local address such as `127.0.0.1`, `localhost`, or `192.168.x.x` is reachable only from the same computer or local network.

Any static HTTPS host can serve the game. Upload the complete project so `index.html`, `js/`, `css/`, and `assets/` keep the same relative paths.

## 2. Configure short-lived TURN credentials

Set `window.NLA_TURN_ENDPOINT` in `js/deployment-config.js` to your HTTPS credential endpoint:

```js
window.NLA_TURN_ENDPOINT = 'https://your-domain.example/api/turn-credentials';
```

The endpoint must allow the game website's origin and return JSON in this shape:

```json
{
  "iceServers": [
    {
      "urls": [
        "turn:turn.example.com:3478?transport=udp",
        "turn:turn.example.com:3478?transport=tcp",
        "turns:turn.example.com:5349"
      ],
      "username": "short-lived-user",
      "credential": "short-lived-password"
    }
  ]
}
```

Use time-limited credentials issued by your TURN provider. Never commit a permanent TURN password to this repository.

## 3. Verify before sharing

Open **Play Online Together**. The panel should say **Worldwide relay ready**. Test with one phone on Wi-Fi and the other on mobile data; this is a better overseas-network test than using two devices on the same router.

The game prefers the lower-latency direct route and automatically uses TURN only when the networks cannot connect directly.

