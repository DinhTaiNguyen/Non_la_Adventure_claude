/* Deployment-only settings.
   Set this to an HTTPS endpoint that returns short-lived TURN credentials:
   { "iceServers": [{ "urls": ["turns:turn.example.com:5349"],
      "username": "temporary-user", "credential": "temporary-secret" }] }

   Never put permanent TURN usernames or passwords in this public file. */
window.NLA_TURN_ENDPOINT = window.NLA_TURN_ENDPOINT || '';

