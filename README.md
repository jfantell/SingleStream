# SingleStream: All-In-One Music Player and Social Network

Developers: Roshni Vachhani, Ryan Flynn, John Fantell, Will Stone, Robert Rotering (Web Science Systems Development - Spring 17 - Team 8)

Project Description: Music Is Everywhere but now you will not have to be. Music lovers should not have to decide what media platform they would like to use when their favorite songs are scattered across them. SingleStream puts your favorite songs from various media platforms in one place -- a combination of your favorite tracks from Spotify, freestyles from SoundCloud, and remixes from YouTube together like they should be. But SingleStream is not only a music hub -- it is a social network and powerful analytics platform for visually exploring music within one's community of followers and friends.

The git repo for SingleStream is located at:
https://github.com/jfantell/SingleStream (Master repo is called "gh-pages")

The midterm and final presentations, initial project proposal, and a project conclusion/review are also featured in the git repo.

**** App Architecture ****

server.js (Server file)

app/	   (Contains router files and mongo db schemas)

-routes.js   (Proccesses all get and post requests)

-routes_support_functions.js  (Core functionality for external API calls, processing db queries/deletions/insertions/verifying authentication before making requests/retrieving analytics data is implemented here)

-models/  (Two db schemas)

--playlist.js  (Stores playlist information, including tracks and semantic tags)

--user.js  (Contains refresh tokens for Google and Napster, and additional user information)

config/   (Contains mongo db and passport authentication information as well as api keys for Napster and Google)

-config.js (mongo db connection)

-passport.js (configure passport middleware for local user account)

-auth.js (Contains api keys for napster and google)

views/ (Contains all ejs pages and appropriate formatting/js resources)

**** Technologies ****

EJS - Embedded Javascript:
	Template engine (documentation: http://www.embeddedjs.com/)

NodeJS/Express

AngularJS

MongoDB/Mongoose

HTML5/Bootstrap, CSS3, JS, jQuery


**** APIS ****

Google Visualization API (documentation: https://developers.google.com/chart/interactive/docs/reference)

Napster Web API (documentation: https://developer.napster.com/api/v2.1)

YouTube V3 Data API  (documentation: https://developers.google.com/youtube/v3/)

**** BUGS IDENTIFIED (Working on a fix) ****

Sometimes user is logged out upon the first time they authenticate with either Google or Napster. There is a message at the top of the screen
that alerts the user this may happen, and informs the user what to do if it does (which is simply just logging back in)

**** Future Improvements ****

After completing the project for the semester our group is very excited about what we completed. We invested a lot of time and effort into the project and see potential for a great product in the future. The team will likely continue development on the project to improve existing features and add more.

We would like to add more music services to our platform to make it a more robust tool. We would also like to change Napster’s music player from Flash to an HTML player when they release their next API update. Finally, we’d like to improve the playlist functionality to have a few more features such as song skip, replay, pause, and shuffle library. There are a lot of improvements we can make to the project but now we’re no longer bound in a time frame. We’ll work on the project in our own time and add features that we feel would improve the site.


**** QUESTIONS, COMMENTS, SUGGESTIONS, BUGS ****

Open an issue in GitHub.
