var request = require('request');
const Youtube = require("youtube-api");
var GoogleTokenProvider = require('refresh-token').GoogleTokenProvider;
var NapsterTokenProvider = require('refresh-token');

//Load the user database schema
var User       = require('./models/user');
//Load the playlist database schema
var Playlist = require('./models/playlist');

//Global unitiliazed variable to construct Napster authorization uri
var oauth2;

//Needed to get the Google and Napster API credentials
var configAuth = require('../config/auth'); // use this one for testing

//Export support functions so they can be called from the routes.js file
var self = module.exports = {

	//Recusively find all playlist tags featured in a user's playlist, user's follower's playlists
	//or user's followings playlists (NOTE: "followings" are the users that the logged in user is following)
	
	//The "concat" parameter contains all of the users the recusive function will examine playlists for
	//Users specify how they want to filter the analytics in the front - end
	//By default it is set to recurse through all playlists in a user's inner circle (followings, followers, the user themselves),
	//find all tags, and then return these tags to the front end

	//The "dict" parameter is an JS object that simulates a python dictionary to some degree. Basically it is constructed using key-value pairs
	//keys in this case are tags, and values represent frequency of these tags in the user's inner circle
	//For example, lets suppose a playlist tag is "Pop." If the user has 1 playlist tagged with "Pop" and one of their followers does as well,
	//in the dict object the key would be "Pop" and the frequency would be "2." 

	//keys is an array of unique keys. It is used to index the dict object. Both keys and dict are returned to the client where they are
	//parsed and displayed using Google Visualization APIss
	recursive_find_tags: function(i,concat,post_parameters,dict,keys,res){
		//Base Case: all playlists for all users have been searched
	    if(i == concat.length){
	        res.send([dict,keys]);
	        return;
	    }

	    //Find a particular user's playlists
	    Playlist.find({ 'user_id' :  concat[i]._id }, function(err, playlists) {

	    	if (playlists.length == 0) {
	    		console.log('Error 104: User has no playlists');
	    		self.recursive_find_tags(i+1,concat,post_parameters,dict,keys,res);
	    	}

	    	else {

		        //Iterate over all playlists for that user
		        for(j=0; j<playlists.length; j++){

		        	if(playlists[j].tags.length == 0){
		        		console.log("Error 105: No Tags Found");
		                if(j == (playlists.length-1)) {
		                    self.recursive_find_tags(i+1,concat,post_parameters,dict,keys,res);
		                }
		        	}

		            //Iterate over all tags for a particular playlist j
		            for(k=0; k<playlists[j].tags.length; k++){

		            	//If new key is found, add it to the keys array and dict object
		            	//Frequency is 1
		                if(dict[playlists[j].tags[k]] == undefined){
		                    dict[playlists[j].tags[k]] = 1;
		                    keys.push(playlists[j].tags[k]);
		                }
		                //Key already stored in dict object, increase frequency
		                else{
		                    dict[playlists[j].tags[k]] += 1;
		                }

		                //All tracks in all playlists for a particular user have been visited
		                //Recurse to next user
		                if(j == (playlists.length-1) && k == (playlists[j].tags.length-1)) {
		                    self.recursive_find_tags(i+1,concat,post_parameters,dict,keys,res);
		                }
		            }
		        }
		    }
	    });
	},


	//Recusively find all playlist artists or track names featured in a user's playlist, user's follower's playlists
	//or user's followings playlists (NOTE: "followings" are the users that the logged in user is following)
	//The user specifies what they would like to query (track names or artists) on the front end
	
	//The "concat" parameter contains all of the users the recusive function will examine playlists for
	//Users specify how they want to filter the analytics in the front - end
	//By default it is set to recurse through all playlists in a user's inner circle (followings, followers, the user themselves),
	//find all artists OR tags, and then return these artists or tracks to the front end

	//The "dict" parameter is an JS object that simulates a python dictionary to some degree. Basically it is constructed using key-value pairs
	//keys in this case are tags, and values represent frequency of these tags in the user's inner circle
	//For example, lets suppose a playlist artist is "Michael Jackson." If the user has 1 playlist in which the artist "Michael Jackson" with featured, and one of their followers does as well,
	//in the dict object the key would be "Michael Jackson" and the frequency would be "2." 

	//keys is an array of unique keys. It is used to index the dict object. Both keys and dict are returned to the client where they are
	//parsed and displayed using Google Visualization APIss
	recursive_find: function(i,concat,post_parameters,dict,keys,res){

		//Base Case: all playlists for all users have been searched
	    if(i == concat.length){
	        res.send([dict,keys]);
	        return;
	    }
	   	//Find a particular user's playlists
	    Playlist.find({ 'user_id' :  concat[i]._id }, function(err, playlists) {
	    	//Iterate over all playlists for that user

	    	if (playlists.length == 0) {
	    		console.log('Error 106: User has no playlists');
	    		self.recursive_find(i+1,concat,post_parameters,dict,keys,res);
	    	}

	    	else {
		        for(j=0; j<playlists.length; j++){

		        	///!!!!!!!!! ANALYZE

		        	//If number of tracks in particular playlist is 0; move to the next one
		        	if(playlists[j].tracks.length == 0){
		                if(j == (playlists.length-1)) {
		                    self.recursive_find(i+1,concat,post_parameters,dict,keys,res);
		                }
		        	}

		        	//Iterate over all tracks for a particular playlist j
		            for(k=0; k<playlists[j].tracks.length; k++){

		                //Artists
		                if(post_parameters.option == "Artists"){
		                	//If new key is found, add it to the keys array and dict object
		            		//Frequency is 1
		                    if(dict[playlists[j].tracks[k].channel_artist] == undefined){
		                        dict[playlists[j].tracks[k].channel_artist] = 1;
		                        keys.push(playlists[j].tracks[k].channel_artist);
		                    }
		                    //Key already stored in dict object, increase frequency
		                    else{
		                        dict[playlists[j].tracks[k].channel_artist] += 1;
		                    }
		                }

		                //Tracks
		                else if(post_parameters.option == "Tracks"){
		            		//If new key is found, add it to the keys array and dict object
		            		//Frequency is 1
		                    if(dict[playlists[j].tracks[k].track_name] == undefined){
		                        dict[playlists[j].tracks[k].track_name] = 1;
		                        keys.push(playlists[j].tracks[k].track_name);
		                    }
		                    //Key already stored in dict object, increase frequency
		                    else{
		                        dict[playlists[j].tracks[k].track_name] += 1;
		                    }
		                }
		                
		                //All tracks in all playlists for a particular user have been visited
		                //Recurse to next user
		                if(j == (playlists.length-1) && k == (playlists[j].tracks.length-1)) {
		                    self.recursive_find(i+1,concat,post_parameters,dict,keys,res);
		                }
		            }    
		        }
	    	}
	    });
	},

	//The "analytics" function checks for the user's requested query operation (query playlists by tags, tracks by artists, or tracks by song name)
	//as well as filters (filter by only user's playlists, user's followers playlists, and/or user's followings playlists)
	//All three filters are marked by default

	//The function essentially searches all tags, artists, or track names (depending on what the user wants - only one query operation at a time)
	//for all playlists for all users and returns an array to the front end. The first element is an object that resembles a python dictionary.
	//It contains key-value pairs (keys will either be a tag, artist or track name; values will the frequency of that name occuring given the provided
	//filters

	//Most of this work however happens in two recusrive functions called by the the "analytics" function
	//"recursive_find" and "recursive_find_tags"
	//The first is concerned with recusively finding artist or track names, the second is concerned with finding playlist tags

	//Right now the "analytics" function only handles one specific operation (which we call an api_call)
	
	analytics: function(session_user_id, api_call, res, post_parameters){
	    User.findOne({ '_id' :  session_user_id }, function(err, user) {
	        //Identify the api call
	        if(api_call == 'analytics_artist_search'){
	        	//Initialize the filter (what users to include in the filter)
	            var concat = "";

	            //Get users followings
	            var following = user.following;
	            //Get users followers
	            var followers = user.followers;

	            var i=0;

	            var dict = {}; //dictionary where keys are artists, values are count of mentions among followers, followings, and/or the user
	            var keys = []; //list of keys

	            //Users own information
	            var me = [{ _id : String(session_user_id), name: user.local.email }];

	            //Construct the filter

	            //User's own playlists, user follower playlists, user following playlists
	            if(post_parameters.checked.following == 'YES' && post_parameters.checked.followers && post_parameters.checked.me == 'YES'){
	                concat = (following.concat(followers)).concat(me);
	            }

	            //User follower playlists, user following playlists
	            else if(post_parameters.checked.following == 'YES' && post_parameters.checked.followers == 'YES' ){
	                concat = following.concat(followers);
	            }

	            //User's own playlists and user following playlists
	            else if(post_parameters.checked.following == 'YES' && post_parameters.checked.me == 'YES' ){
	                concat = following.concat(me);
	            }
	            //User's own playlists and user follower playlists
	            else if(post_parameters.checked.followers == 'YES' && post_parameters.checked.me == 'YES' ){
	                concat = followers.concat(me);
	            }
	            //User's follower playlists ONLY
	            else if(post_parameters.checked.followers == 'YES'){
	                concat = followers;
	            }
	            //User's following playlists ONLY
	            else if(post_parameters.checked.following == 'YES'){
	                concat = following;
	            }
	            //User's own playlists ONLY
	            else if(post_parameters.checked.me == 'YES'){
	                concat = me;
	            }
	            //All check boxes unchecked on front end, alert user
	            else{
	                res.send("Please check at least one box!");
	                return;
	            }
	            //Recusive call that handles query for artists or track names
	            if(post_parameters.option == 'Artists' || post_parameters.option == 'Tracks'){
	                self.recursive_find(i,concat,post_parameters,dict,keys,res);
	            }
	            //Recursive call that handles query for tags
	            else if(post_parameters.option == 'Tags'){
	                self.recursive_find_tags(i,concat,post_parameters,dict,keys,res);
	            }
	            //Some error occured
	            else{
	                res.send("There was an error!");
	            }
	            
	        }
	    });
	},

//The "rest" function handles the following (its alot)
/* 
	1. initializing google and napster access tokens for api calls, 
	2. searching new songs from napster and youtube, 
	3. Creating new playlists,
	4. deleting existing playlists, 
	5. adding new songs to an existing playlist, 
	6. deleting songs from an existing playlist,
	7. retrieveing all existing playlists for a particular user,
	8. retrieving all playlists for a particular follower of a user,
	9. retrieving all playlists for a user the authenticated user is following,
	10. cloning a follower's/following's playlist (copied to authenticated users account),
	11. searching for users to follow,
	12. adding users to follow (when you add a following, you become their follower),
	13. retrieve a user's followers/followings (followers are people that follow the authenticated user, 
		followings are people the authenticated user follows),
	14. retrieving napster credentils and sending them to the client Napster Web API,
	15. adding a user biography,
	16. unlinking Google from a user's local account


	*Searching Google and Napster databases requires to extra helper functions called "napster_songs" and "google_videos"


*/
 	rest: function(session_user_id, api_call, res, post_parameters){
	    User.findOne({ '_id' :  session_user_id }, function(err, user) {

	        //Two unitliaized global variables to hold the refresh tokens for Google and Napster respectively
	        var gTokenProvider, nTokenProvider;
	       	//Boolean flags to determine whether users are authenticated w/ particular service
	        napster_set = false;
	        google_set = false;
	        
	        //Variables to store objects that will be passed back to the client in some api calls
	        var g_playlists, n_playlists;

	        //Check if napster refresh token has been set in the user's local account
	        if(user.napster.refreshToken != undefined){
	            //If so, initialize the refresh-token module to work with napster
	            //This ensures us we will always have a valid access token
	            nTokenProvider = new NapsterTokenProvider( 'https://api.napster.com/oauth/access_token', {
	                refresh_token: user.napster.refreshToken, 
	                client_id:     configAuth.napsterAuth.clientID, 
	                client_secret: configAuth.napsterAuth.clientSecret
	            });
	            napster_set = true;
	        }

	        //Check if Google refresh token has been set
	        if(user.google.refreshToken != undefined){
	            //If so initialize the refresh-token module for Google
	            gTokenProvider = new GoogleTokenProvider({
	                refresh_token: user.google.refreshToken, 
	                client_id:     configAuth.googleAuth.clientID, 
	                client_secret: configAuth.googleAuth.clientSecret
	            });
	            google_set = true;
	        }

	        //Search for songs in all authenticated services
	        if(api_call == "search"){
	        	//Array to hold all songs found
	            var songs = [];
	            //Hold any errors as well
	            var errors = [];
	            

	            //napster_songs and google_videos make Restful API search calls to napster and google respectively
	            //we need two use callback functions to ensure we have gathered all the songs from one service
	            //before we go to the next

	            //songs array, napster auth boolean, token obect, query, callback are parameters
	            self.napster_songs(songs,napster_set,nTokenProvider,post_parameters, session_user_id, errors, function(done_1) {
	            	//songs array, napster auth boolean, token obect, query, callback are parameters
	                self.google_videos(songs,google_set,gTokenProvider,post_parameters,session_user_id, errors, function(done_2){
	                	//If any errors, notify the user
                        if (errors.length != 0) {
                            res.send(errors);
                        }
                        //No songs returned
                        else if (songs.length == 0) {
                            res.send('none');
                        }
                        //Send array of songs to client
                        else {
                            res.send(songs);
                        }
	                });
	            });    
	        }

	        //Creates a new playlist
	        if(api_call == "create_playlist"){

	            // create the playlist
	            var newPlaylist = new Playlist();
	            //array of tags
	            var tags = post_parameters.tags.split(",").map(function(item) {
	              return item.trim();
	            });
	            var date = new Date();

	            // for now just looking at user id and initializing track count
	            newPlaylist.user_id = session_user_id;
	            newPlaylist.track_count = 0;
	            newPlaylist.name = post_parameters.playlist_name;
	            newPlaylist.description = post_parameters.description;
	            newPlaylist.tags = tags;
	            newPlaylist.icon = post_parameters.icon;
	            newPlaylist.created = date.toDateString();
	            newPlaylist.save(function(err) {
	                if (err)
	                    console.log(err);
	                res.send("Done");
	            });  
	        }

	        //Delete existing playlist
	        if(api_call == "delete_playlist"){
	            Playlist.remove({'user_id': session_user_id, 'name' : post_parameters.playlist_name}, function(){
	                res.send("Done");
	            });
	        }

	        //Get all user's custom playlists from mongodb
	        if(api_call == "get_playlists"){
	            Playlist.find({ 'user_id' :  session_user_id }, function(err, playlists) {
	                res.send(playlists);
	            });
	        }

	        //Get all playlists from the user's follower
	        if(api_call == "get_playlists_follower"){
	            Playlist.find({ 'user_id' :  post_parameters.friend }, function(err, playlists) {
	                res.send(playlists);
	            });
	        }

	        //Get all playlists from the user's following (someone the user is following)
	        if(api_call == "get_playlists_following"){
	            Playlist.find({ 'user_id' :  post_parameters.friend }, function(err, playlists) {
	                res.send(playlists);
	            });
	        }

	        //Clone a playlist from a follower or following
	        if(api_call == "clone"){
	            Playlist.findOne({ 'user_id' :  post_parameters.friend, 
	                                'name':post_parameters.playlist_name }, function(err, cloned) {

	                newPlaylist = new Playlist();
	                newPlaylist.user_id = session_user_id;
	                newPlaylist.track_count = cloned.track_count;
	                newPlaylist.name = cloned.name;
	                newPlaylist.description = cloned.description;
	                newPlaylist.tags = cloned.tags;
	                newPlaylist.created = cloned.created;
	                newPlaylist.tracks = cloned.tracks;
	                newPlaylist.icon = cloned.icon;
	                newPlaylist.save(function(err) {
	                if (err)
	                    console.log(err);
	                    res.send("cloned");
	                });  

	            });
	        }

	        //Delete a track
	        if(api_call == "delete_track"){
	            Playlist.update({'user_id': session_user_id, 'name' : post_parameters.playlist_name}, { $pull: { "tracks" : { "track_id": post_parameters.track_id } } }, function(){
	                res.send("Done");
	            });
	        }

	        //Add a song to a playlist
	        if(api_call == "add_to_playlist"){
	        	//Our playlist functionality on the front end requires us to have the duration of each song or video
	        	//YouTube does not provide this information using the search api alone (which we called out to when the user initially
	        	//searched for a particular track/artist/channel_name)
	        	//Instead, we record the video id returned for each video from the YouTube search API
	        	//If a user selects to add that particular video to a playlist we make an additional API call to get additional
	        	//information about that video (including the duration)

	        	//post_parameters.result[5] specifies the source of the video or song (either youtube or napster)
	        	//if source is youtube
	            if(google_set && post_parameters.result[5] == "youtube"){
	                gTokenProvider.getToken(function (err, token) {
	                    var contentDetails = {
	                        url: 'https://www.googleapis.com/youtube/v3/videos?id='+ post_parameters.result[0] +'&part=snippet,contentDetails',
	                        headers: { 'Authorization': 'Bearer ' + token },
	                        json: true
	                    };
	                    //new youtube track request to get video duration (only if youtube source)
	                    request.get(contentDetails, function(error, response, contents) {
	                      
	                       var runtime = "";
	                      
	                       var duration = contents.items[0].contentDetails.duration;
	                       
	                        //convert Youtube iso format to seconds
	                        var total = 0;
	                        var hours = duration.match(/(\d+)H/);
	                        var minutes = duration.match(/(\d+)M/);
	                        var seconds = duration.match(/(\d+)S/);
	                        if (hours) total += parseInt(hours[1]) * 3600;
	                        if (minutes) total += parseInt(minutes[1]) * 60;
	                        if (seconds) total += parseInt(seconds[1]);
	                        duration = total;
	                        runtime = duration;
	                       
	                       //Construct track object
	                        var track = {track_id: post_parameters.result[0], 
	                            channel_artist: post_parameters.result[1], 
	                            track_name: post_parameters.result[2], 
	                            url: post_parameters.result[3],
	                            runtime: runtime,
	                            source: post_parameters.result[5]};

	                          //Add to existing playlist
	                        Playlist.findByIdAndUpdate(post_parameters.playlist_id, {
	                          $push: { tracks: track }
	                        }, function (err, playlist) {
	                            console.log(err);
	                        });
	                        res.end();
	                    });
	               });
	            }
	            //if source is napster
	            else if (post_parameters.result[5] == "napster") {
	            	//Construct track object
	                var track = {track_id: post_parameters.result[0], 
	                    channel_artist: post_parameters.result[1], 
	                    track_name: post_parameters.result[2], 
	                    url: post_parameters.result[3],
	                    runtime: post_parameters.result[4],
	                    source: post_parameters.result[5]};
					//Add to existing playlist
	                Playlist.findByIdAndUpdate(post_parameters.playlist_id, {
	                  $push: { tracks: track }
	                }, function (err, playlist) {
	                    console.log(err);
	                });
	                res.end();
	            }

	            //something went wrong
	            else {
	                res.send("Something went wrond: error103");
	            }
	        }

	        //Search db for users by email
	        if(api_call == "find_users_to_follow"){
	            User.find({ 'local.email' :  post_parameters.q }, function(err, followers) {
	                res.send(followers);
	            });
	        }

	        //Follow another user
	        //When you follow another user you show up in their
	        //followers list, they show up in your followings list
	        //followers and followings are associated using user ids
	        if(api_call == "add_following"){
	            var following = {_id: post_parameters.result._id, name: post_parameters.result.local.email};
	            var followers = {_id: session_user_id, name: user.local.email};
	            User.findByIdAndUpdate(session_user_id, {
	              $push: { following : following }
	            }, function (err, user) {
	                console.log(err);
	            });
	            User.findByIdAndUpdate(post_parameters.result._id, {
	              $push: { followers : followers }
	            }, function (err, user) {
	                console.log(err);
	            });
	            res.end();
	        }

	        //Return list of all followers/followings for the authenticated user
	        if(api_call == 'get_followers_following') {
	            User.findOne({ '_id' :  session_user_id }, function(err, user) {
	                res.send([user.followers, user.following]);
	            });
	        }

	        // //For the napster player, we need to send the access token and refresh token to the client
	        if(api_call == "tracks_info"){
	            if(napster_set) {
	                nTokenProvider.getToken(function (err, token) {
	                   res.send({access_token: token, refresh_token: user.napster.refreshToken}); 
	               });
	            }
	        }
	        //Unlink Google Account
	        if(api_call == "unlink"){
	            gTokenProvider.getToken(function (err, token) {
	                var options = {
	                    url: 'https://accounts.google.com/o/oauth2/revoke?token=' + token,
	                };
	                request.get(options, function(error, response, body) {
	                });  
	            });
	        }

	        //Attach a biograph to the authenticated user's account
	        if(api_call == "attach_bio"){
	            User.findOne({ '_id' :  session_user_id }, function(err, user) {
	                console.log(err);
	                user.biography = post_parameters.bio;
	                user.save(function(err) {
	                    if(err) console.log(err);
	                });
	            });
	            res.send("updated");
	        }
	    });
	    return;
	},

//-----------------------------
//Search API Call
//-----------------------------

	//Search napster's catalog given user input
	//I.E. A user types in "Michael Jackson", we will search Napster
	//songs catalog for those that relate to Michael Jackson

	//we pass in the songs array from the "rest" function, which will store all songs we find from both napster and google
	//we pass in the napster token object as well; allows us to get a new access token using the refresh token
	//stored in the authenticated user's account
	napster_songs: function(songs,napster_set,nTokenProvider,post_parameters, reqUser, errors, callback){
		//if napster is set
	    if(napster_set){
	    	//generate access token
	        nTokenProvider.getToken(function (err, token) {

	            //there's an error, proceed to google
	            if (err) {
	                User.findOne({ '_id' :  reqUser }, function(err, user) {
	                    console.log(err);
	                    user.napster.refreshToken = undefined;
	                    //inform user
	                    errors = "101";
	                    user.save(function(err) {
	                        if(err) console.log(err);
	                        callback('reset');
	                    });
	                });
	            }

	            //call the search api, retrirve 5 related results
	            else {
	                var tracks = {
	                    url: 'https://api.napster.com/v2.1/search?q='+post_parameters+'&type=track&limit=5',
	                    headers: { 'Authorization': 'Bearer ' + token },
	                    json: true
	                };
	                request.get(tracks, function(error, response, body) {
	                   console.log("Tracks");
	                   if (body.data.length == 0) {
	                        callback("done");
	                   }
	                   else {
	                   		//add all results to songs array
	                       for(i = 0; i < body.data.length; i++){
	                            songs.push([body.data[i].id, 
	                                        body.data[i].artistName, 
	                                        body.data[i].name, 
	                                        body.data[i].href,
	                                        body.data[i].playbackSeconds,
	                                        "napster"]);
	                            if(i == body.data.length-1){
	                            	//proceed to google search
	                                callback("done");
	                            }
	                        }
	                    }
	                }); 
	            }  
	        });  
	    }
	    else {
	    	//proceed to google search
	        callback("done");
	    }
	},
	//Search google's/youtube's catalog given user input
	//I.E. A user types in "Michael Jackson", we will search YouTube
	//videos for those that relate to Michael Jackson

	//we pass in the songs array from the "rest" function, which will store all songs we find from both napster and google
	//we pass in the google token object as well; allows us to get a new access token using the refresh token
	//stored in the authenticated user's account
	google_videos: function(songs,google_set,gTokenProvider,post_parameters, reqUser, errors, callback){
	    if(google_set){
	        gTokenProvider.getToken(function (err, token) {

	            //if error proceed back to "rest" function where we return the songs array (if any songs have been added)
	            if (err) {
	                User.findOne({ '_id' :  reqUser }, function(err, user) {
	                    console.log(err);
	                    user.google.refreshToken = undefined;
	                    //inform user
	                    errors.push("102");
	                    user.save(function(err) {
	                        if(err) console.log(err);
	                        callback('reset');
	                    });
	                });
	            }

	            //YouTube search api call using valid access token
	            else {
	                var videos = {
	                    url: 'https://www.googleapis.com/youtube/v3/search?part=snippet&q='+post_parameters+'&type=video',
	                    headers: { 'Authorization': 'Bearer ' + token },
	                    json: true
	                };
	                request.get(videos, function(error, response, body) {
	                    //Parse body and add each video to an array with the needed data/metadata
	                    var youtube_videos = [];
	                    if (body.items.length == 0) {
	                    	//return to "rest" function
	                        callback("done");
	                    }
	                    else {
	                        for(i=0; i < body.items.length; i++){
	                            // Save important data for each video to master array
	                            songs.push([body.items[i].id.videoId, 
	                                        body.items[i].snippet.channelTitle, 
	                                        body.items[i].snippet.title, 
	                                        "https://www.youtube.com/embed/" + body.items[i].id.videoId,
	                                        '0',
	                                        "youtube"]);
	                            if(i == body.items.length-1){
	                                //return to "rest" function
	                                callback("done");
	                            }
	                        }
	                    }
	                });
	            }
	        });
	    }
	    else {
	    	//return to "rest" function
	        callback('done');
	    }
	}
};