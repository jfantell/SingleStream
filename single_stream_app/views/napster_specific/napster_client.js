function player(){
  $.get("/tracks_info", function(data, status){
    Napster.init({ consumerKey: API_KEY });

    var currentTrack;
    Napster.player.on('ready', function(e) {

      Napster.member.set({
          accessToken: data.access_token,
          refreshToken: data.refresh_token
      });

      Napster.api.get(false, '/tracks/top', function(data) {
        var tracks = data.tracks;
        tracks.forEach(function(track, i) {
          var $t = $('<div class="track" data-track="' + track.id + '">' +
                       '<div class="album-art"></div>' +
                       '<div class="track-info">' +
                         '<div class="progress-bar"></div>' +
                         '<div class="name">' + track.name + '</div>' +
                         '<div class="artist">' + track.artistName + '</div>' +
                         '<div class="duration">' + Napster.util.secondsToTime(track.playbackSeconds) + '</div>' +
                         '<div class="current-time">' + Napster.util.secondsToTime(track.playbackSeconds) + '</div>' +
                       '</div>' +
                      '</div>');

          $t.click(function() {
            var id = track.id;

            if (Napster.player.currentTrack === id) {
              Napster.player.playing ? Napster.player.pause() : Napster.player.play(id);
            }
            else {
              $('[data-track="' + id + '"] .progress-bar').width(0);
              $('[data-track="' + id + '"] .current-time').html($('[data-track="' + id + '"] .duration').html());

              Napster.player.play(id);
            }
          });

          $t.appendTo('#tracks');

          Napster.api.get(false, '/albums/' + track.albumId + '/images', function(data) {
            var images = data.images;
            $('[data-track="' + track.id + '"] .album-art')
              .append($('<img>', { src: images[0].url }));
          });
        });
      });
    });

    Napster.player.on('playevent', function(e) {
      var playing = e.data.playing;
      var paused = e.data.paused;
      var currentTrack = e.data.id;

      $('[data-track]').removeClass('playing paused');
      $('[data-track="' + currentTrack + '"]').toggleClass('playing', playing).toggleClass('paused', paused);
    });

    Napster.player.on('playtimer', function(e) {
      var id = currentTrack;
      var current = e.data.currentTime;
      var total = e.data.totalTime;
      var width = $("[data-track='" + id + "'] .track-info").width();

      $("[data-track='" + id + "']").addClass("playing");
      $("[data-track='" + id + "'] .progress-bar").width(parseInt((current / total) * width).toString() + "px");
      $("[data-track='" + id + "'] .current-time").html(Napster.util.secondsToTime(total - current));
    });

    Napster.player.on('error', console.log);
  });
}