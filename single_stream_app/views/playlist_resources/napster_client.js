// var player_set = false;

function player(id,operation){
  var API_KEY = 'YWQzNWQxZWMtNDU5Mi00NjJjLThkNTAtNjcwN2M4Yjc5NWM4';
  $.get("/tracks_info", function(data, status){
    Napster.init({ consumerKey: API_KEY });

    // if(!player_set){
    Napster.player.on('ready', function(e) {
      Napster.member.set({
        accessToken: data.access_token,
        refreshToken: data.refresh_token
      });
      console.log("You reached here as well");
      
      if(operation == 'play'){
        Napster.player.play(id);
        console.log("Play");
      }
      else if(operation == 'pause'){
        Napster.player.pause();
        console.log("Pause");
      }
      player_set= true;
      console.log(data.access_token, data.refresh_token);
    });
    // }
    
    // if(player_set){
    //   if(operation == 'play'){
    //     Napster.player.play(id);
    //     console.log("Play");
    //   }
    //   else if(operation == 'pause'){
    //     Napster.player.pause();
    //     console.log("Pause");
    //   }
    // }

    Napster.player.on('error', console.log);
  });
}