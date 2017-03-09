/*!
 * Example - app.js
/* ========================================================= */


// Album function
// ========================================================= //
$('.content').on('click', '.album', function () {
    var albumBg = $(this).find('.art').css('backgroundImage'),
        albumClassName = $(this).attr('class').replace(/album| /g, ''),
        thisAlbumClass = '.' + albumClassName,
        thisAlbumContent = $('.album-content' + thisAlbumClass).first(),
        // -- whichTab is important for albums that inside genres pages
        whichTab = thisAlbumContent.parents('.tab');

    
    $('#title').removeClass('discover');
    $('.menu-ico,.menu,#title p,.tab').removeClass('active');
    $('.content').addClass('active');
    whichTab.add(thisAlbumContent).addClass('active');
    //thisAlbumContent.addClass('active');
    $('.menu-ico').addClass('back');
    $('.bottom').addClass('active');
    $('.content').addClass('lessheight');
    // -- Cheap If(...) knockoff 
    // -- Clicking on albums ONLY inside music page would add classes
    $('body.music #selectFiles').addClass('passive changed');

    $('.genreArt').css('background', 'none');
    $('.bg,.album-content.active > .album-large .art,#bottomArt').css({
        'backgroundImage': albumBg,
        'backgroundPosition': 'center center',
        'backgroundSize': 'cover'
    });

    // -- Calling Player
    var sElementNew = thisAlbumClass+' .songs li:first-child';
    sP.play(sElementNew);
    

    $('.bottom').removeClass('radio-ui');

});
// ========================================================= //


// Speical case for Radio Page
// ========================================================= //
$('.radio-li').click(function () {
    // -- Showing bottom and activting radio UI
    $('.bottom').addClass('active radio-ui');
    $('.content').addClass('lessheight');
    $('.album-content .songs li,.content.starred .songs li').removeClass('nowplaying');
    $('.radio-wrapper .songs li:first-child').addClass('nowplaying');
    $('.radio-wrapper .songs li').removeClass('wasplaying');
    
    // -- Calling Player
    var sElementNew = '.radio-wrapper .songs li:first-child';
    sP.play(sElementNew, 'radio');
});
// ** to make sure the bottom has the right classes
// ** I know we added the class when we opened the radio page but
// ** If Radio is open > Search for a song and play it > Go back
// ** Goes back automaticly to radio page but the bottom
// ** doesnt has radio-ui class which isnt right
$('.content.radio').on('click', '.songs li', function () {
    $('.bottom').addClass('active radio-ui');
});

// Speical case for starred Page
// ========================================================= //
$('.content.starred').on('click', '.songs li', function () {
    $('.bottom').addClass('active').removeClass('radio-ui');
    $('.content').addClass('lessheight');

});
// ========================================================= //


// Song Playlist [Extra]
// ========================================================= //
$('.content').on('click', '.songs li', function () {
    if ($('.album-content').hasClass('active')) {
        $('.bottom').removeClass('radio-ui')
    }
});
// ========================================================= //


// Play song by ID function
// ========================================================= //
function openAlbumByID(id, justReadyID) {
    // ** Note: I'm dealing here with all options
    // ** so this function can be called anywhere anytime
    // ** its coded to deal with duplicated, i.e. search results list.
    // ** This function is super awesome, check it out
    var itsAlbumContent = $('#' + id).parents('.album-content'),
        itsAlbumClass = $(itsAlbumContent).attr('class').replace(/album-content|active| /g, ''),
        itsTabClass = '';
    if($('#' + id).parents('.tab').attr('class')) {
        itsTabClass = $('#' + id).parents('.tab').attr('class').replace(/tab|active|selected| /g, '');
    } else {
        itsTabClass = false
    } 

    // -- Close Menu / Reset menu btn / Close all albums / Hide active titles
    $('.menu, .menu-ico,.album,.album-content,#title p').removeClass('active');
    // -- Displaying the right .content
    $('.content').removeClass('selected');
    $('#' + id).parents('.content').addClass('selected');
    // -- Displaying the right .tab *if
    $('.content.discover .tab').removeClass('active');
    if(itsTabClass) {
        $('.tab.'+itsTabClass).addClass('active');
    }
    // -- Reset title (Hide it)
    $('#title').removeClass('discover');
    // -- Activating elements
    $('.bottom,.content,.' + itsAlbumClass).addClass('active');
    // -- Menu back btn
    $('.menu-ico').addClass('back');
    // -- when album inside a genre is active
    $('.' + itsAlbumClass).parent('.genre-content').addClass('active activeIn');
    // -- Bottom is active now so we need less height for content
    $('.content').addClass('lessheight');
    // -- Handling album background stuff
    var itsAlbumBg = $('.album.' + itsAlbumClass).children('.art').css('backgroundImage');
    $('.genreArt').css('background', 'none');
    $('.bg,.album-content.' + itsAlbumClass + ' .album-large .art,#bottomArt').css({
        'backgroundImage': itsAlbumBg,
        'backgroundPosition': 'center center',
        'backgroundSize': 'cover'
    });
     

    // -- Removing Radio ui class if its existed
    $('.bottom').removeClass('radio-ui');
     
    // Hiding selecte files input when opening a local song from reslults
    $('#selectFiles').addClass('passive');
    
    // -- justReadyID
    if (justReadyID) {
        sP.audio.load();
        $('#' + id).addClass('wasplaying');
        $('#playBtn.nowplaying').removeClass('nowplaying');
        $('.content,.menu-ico,.' + itsAlbumClass).removeClass('active back');
        $('.bg').css('background', 'none');
        $('#title').addClass('discover');
        $('#selectFiles').removeClass('passive');
        // ** Ok, How do I explain this to you?
        // ** when only the ID is defined,
        // ** we opens the album-content, right? yeah we do,
        // ** so the tabs list are not visible, so we leave them intact,
        // ** because the global back function connected to tabs list active,
        // ** but when justReadyID is defiend too,
        // ** the tabs list and tabs content are both visiable to you and to me,
        // ** so we re-active back the tab list to the right one
        $('#title.discover li').removeClass('active');
        if(itsTabClass) {
            $('#title.discover .'+itsTabClass).addClass('active');   
        }
    }
}
// ========================================================= //


// Results List [Just open]
// ========================================================= //
$('.results-list').on('click', 'li', function () {
    var getResultID = $(this).attr('data-id');
    openAlbumByID(getResultID)
});
// ========================================================= //


// Share Links [Just open]
// ========================================================= //
// -- wait for the DOM to be fully loaded
$(document).on('ready', function () {

    sP.share(function(id) {
        sP.play('#'+id)
        openAlbumByID(id);
    })
    
});
// ========================================================= //

// Last Played Song 
// ========================================================= //
$(document).on('ready', function () {
    
    sP.lastPlayed(function(id) {
        sP.play('#'+id)
        openAlbumByID(id, 'justReadyID')
    })
    
});

// ========================================================= //


// Open Current album
// ========================================================= //
$('#bottomArt').click(function () {
    var starredDataID = $('.songs li.nowplaying').attr('data-id') || $('.songs li.nowplaying').attr('id'),
        itsAlbumContent = $('#' + starredDataID).parents('.album-content'),
        itsAlbumClass = $(itsAlbumContent).attr('class').replace(/album-content|active| /g, ''),
        itsAlbumBg = $('.album.' + itsAlbumClass).children('.art').css('backgroundImage');
    // ** selected for .content and active for .tab
    $('.content,.tab').removeClass('selected active')
    $('#title').removeClass('discover');
    $('.menu-ico,.menu,#title p').removeClass('active');


    $('.content').addClass('active');
    itsAlbumContent.addClass('active');
    // ** selected for .content and active for .tab
    itsAlbumContent.parents('.content,.tab').addClass('selected active');
    $('.menu-ico').addClass('back');
    $('#selectFiles').addClass('passive');

    $('.genreArt').css('background', 'none');
    $('.bg,.album-content.'+itsAlbumClass+' .album-large .art').css({
        'backgroundImage': itsAlbumBg,
        'backgroundPosition': 'center center',
        'backgroundSize': 'cover'
    });
});
// ========================================================= //


// Special Case: Refresh starred songs Album Bg
// ** Why .content.on(.starred-list li ..)? for
// ** stopPropagation() sake in starBtn and downloadBtn click fns
// ========================================================= //
$('.starred-list').on('click', 'li', function (e) {
    var exceptThese = $('.saveit, .downloadit'); // Clicking on li except .saveit and .downloadit

    if (!exceptThese.is(e.target) // if the target of the click isn't the container...
        && exceptThese.has(e.target).length === 0) // ... nor a descendant of the container
    {
        var starredDataID = $(this).attr('data-id'),
            itsAlbumContent = $('#' + starredDataID).parents('.album-content'),
            itsAlbumClass = $(itsAlbumContent).attr('class').replace(/album-content|active| /g, ''),
            itsAlbumBg = $('.album.' + itsAlbumClass).children('.art').css('backgroundImage');

        $('#bottomArt').css({
            'backgroundImage': itsAlbumBg,
            'backgroundPosition': 'center center',
            'backgroundSize': 'cover'
        });
    }

});
// ========================================================= //