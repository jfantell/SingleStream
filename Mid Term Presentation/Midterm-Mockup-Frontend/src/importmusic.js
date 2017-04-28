/*!
 * Example - importmusic.js
/* ========================================================= */

// sPimportBeta
// ** Dealing with this function is not as hard as it seems,
// ** However sPlayer.js gave us access to the song file object, song tags, song url, song id, song smartcover album artwork.
// ** Now we just need to handle them well.

// ** Note: song tags are sometimes comes partail without for example Artist name and stuff
// ** or sometimes it may come empty, so make sure you use some javascript if statements.

function sPimportBeta(song, tags, url, id, art) {
    $("#selectFiles").addClass('changed');

    // -- Cheap If(...) knockoff
    // -- Remove class ONLY If some album is not active
    $(".content:not(.active) #selectFiles").removeClass('passive');

    var songTitle = tags.Title || song.name,
        albumName = tags.Album || 'Unknown Album',
        artistName = tags.Artist || 'Unknown Artist',
        crAlbumClass = (artistName + albumName).toLowerCase();
    // ** crAlbumClass must not contain album word
    if (crAlbumClass.indexOf('album') != -1) {
        crAlbumClass = crAlbumClass.replace(/album/g, '');
    }

    var albumClass = crAlbumClass.replace(/[`~!@#$%^&*()_|+\-=?;:'" ,.<>\{\}\[\]\\\/]/gi, ''),
        songLiSpan = '<span><i>1</i> <img src="images/svg/pause_line.svg" class="playing"><img src="images/svg/play_line.svg" class="notplaying"></span>',
        songLiSpanSaveit = '<span class="float-r saveit"><img src="images/svg/star_line.svg" class="notstarred"> <img src="images/svg/star_filled.svg" class="starred"></span>',
        songLiSpanDownitIMGs = '<img src="images/svg/cloud_line.svg" class="notdownloaded"> <img src="images/svg/cloud_filled.svg" class="downloaded">';

    // -- Creating Song Li
    var iSongsLi = '<li id="' + id + '" data-song="' + url + '">' + songLiSpan + '<p>' + songTitle + '</p>' + songLiSpanSaveit + '<span class="float-r downloadit isdownloaded"><a href="' + url + '" download>' + songLiSpanDownitIMGs + '</a></span></li>';




    // -- Checking if an album is exist (to prevent albums duplication)
    // ** checking for albumClass albumName  artistName is important
    if (albumClass && $('.' + albumClass).length) {
        // -- last Number from the songs list
        var lastLiNum = $('.album-content.' + albumClass + ' li:last-child').find('i').text();
        // -- if you found the album then just add the song li to the that album
        $('.album-content.' + albumClass + ' ul').append(iSongsLi);
        // -- since we have new element, we increase the last number
        $('.album-content.' + albumClass + ' li:last-child').find('i').text(++lastLiNum);
    } else if(albumClass && !$('.' + albumClass).length && albumName && artistName) {
        // -- if you didnt find any, then go create one
        // -- Create Album
        var iFile = '';
        iFile += '<div class="album ' + albumClass + '">';
        iFile += '<div class="art" style="background: #444 url(' + art + ') center center;background-size:cover"></div>';
        iFile += '<div class="info">';
        iFile += '<h1>' + albumName + '</h1>';
        iFile += '<p>' + artistName + '</p>';
        iFile += '</div></div>';

        // -- Create Album Content
        iFile += '<div class="album-content ' + albumClass + '">';
        iFile += '<div class="album-large"><div class="art"></div></div>';
        iFile += '<div class="songs">';
        iFile += '<h1>' + artistName + ' - ' + albumName + '</h1>';
        iFile += '<ul class="songs-list">';
        iFile += iSongsLi;
        iFile += '</ul></div></div>';

        $('#iFiles').append(iFile);
        responsiveAlbums()

    }


}