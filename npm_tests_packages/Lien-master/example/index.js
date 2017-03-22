"use strict";

const Lien = require("../lib");

// Init lien server
let server = new Lien({
    host: "localhost"
  , port: 9000
  , public: __dirname + "/public"
});

// Listen for load
server.on("load", err => {
    console.log(err || "Server started on port 9000.");
    err && process.exit(1);
});

// Add a dynamic route
server.addPage("/youtube", "post", lien => {
    return lien.apiMsg("You logged in.");
});

// Add a static file
server.addPage("/test", "/index.html");
server.errorPages();

server.on("serverError", err => {
    console.log(err.stack);
});
