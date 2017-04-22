function player(){
  var API_KEY = 'YWQzNWQxZWMtNDU5Mi00NjJjLThkNTAtNjcwN2M4Yjc5NWM4';
  $.get("/tracks_info", function(data, status){
    Napster.init({ consumerKey: API_KEY });

    var currentTrack;
    Napster.player.on('ready', function(e) {

      Napster.member.set({
          accessToken: data.access_token,
          refreshToken: data.refresh_token
      });
      console.log(data.access_token, data.refresh_token);

    });

    Napster.player.on('error', console.log);
  });
}