const fs = require("fs");

// Studio > Messenger "Jot Server's JWT token secret word".
// domains "*" matches the public Railway URL UNA Messenger calls.
const path = "/opt/jot-server/config/config.json";
const config = JSON.parse(fs.readFileSync(path, "utf8"));
config.secret = process.env.JOT_JWT_SECRET || "";
config.domains = ["*"];
fs.writeFileSync(path, JSON.stringify(config));
