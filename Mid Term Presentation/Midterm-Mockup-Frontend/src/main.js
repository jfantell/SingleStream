/*!
 * Example - main.js
/* ========================================================= */


// Burgermenu
// ========================================================= //
$('.header').on('click', '.menu-ico:not(.back)', function () {
    $(this).toggleClass('active');
    $('.menu').toggleClass('active');
});
// ========================================================= //


// Genres
// ========================================================= //
$('.genre').click(function () {
    var genreClass = $(this).attr('class').replace(/genre| /g, ''),
        genreBg = $(this).find('.art').css('backgroundImage'),
        genreArt = $(this).find('.gArt').css('backgroundImage');
    // -- Make sure #title is no longer in discover UI
    $('#title').removeClass('discover');
    // -- Closing menu and hiding page title if available
    $('.menu-ico,.menu,#pageTitle').removeClass('active');

    // -- Active Genre / Active GenreTitle
    $('.content.discover,#genreTitle,.' + genreClass).addClass('active');
    $('#genreTitle').text(genreClass);
    // -- Active Back fn
    $('.menu-ico').addClass('back');

    // -- Handling Genre Background
    $('.bg').css({
        'backgroundImage': genreBg,
        'backgroundSize': 'cover'
    });
    $('.genreArt').css({
        'backgroundImage': genreArt,
        'backgroundSize': 'contain',
        'backgroundPosition': 'center center',
        'backgroundRepeat': 'no-repeat'
    });
});
// -- Special case: Albums inside Genres
$('.genre-content').on('click', '.album', function () {
    $('.genre-content').addClass('activeIn')
});
// ========================================================= //



// Global Back Function
// ========================================================= //
$('.header').on('click', '.menu-ico.back', function () {
    var whichTabAct = $('#title li.active').attr('class').replace(/ |active/g, ''),
        whichPageAct = $('.menu-list li.active').children('span').text().toLowerCase().replace(/ /g, '');

    // -- Hide any Active Albums / Genre / AlbumsInsideGenres
    $('.album, .album-content,.genre, .genre-content').removeClass('active activeIn');
    // -- Reset Menu btn
    $('.menu-ico').removeClass('back active');
    // -- Reset Content
    $('.content').removeClass('selected');
    // -- Reset Search
    $('#search').val('');
    // -- Reset Music Import
    $('#selectFiles').removeClass('passive');
    // -- Hide and Reset Content / genre title / Tabs / Menu
    $('.content,#genreTitle,.content .tab,.menu').removeClass('active');
    // -- Re-Activting title to discover *if
    $('body.discover #title').addClass('discover');
    // -- Re-Activting pageTitle
    $('#pageTitle').addClass('active');
    // -- Activting the right page
    $('.content.' + whichPageAct).addClass('selected');
    // -- Activting the right tab
    $('.content .' + whichTabAct).addClass('active');
    // -- Overflow for content discover back to normal
    //$('.content.discover').css('overflow', 'auto');
    // -- Reset Album/Genre Background
    $('.bg,.genreArt').css('background', 'none');
});
// ========================================================= //


// Menu List
// ========================================================= //
$('.menu-list').on('click', 'li', function () {
    var pageTitle = $(this).children('span').text().toLowerCase().replace(/ /g, ''),
        pageTitleC = '.' + pageTitle;
    // -- Making sure only one page is active
    $('.menu-list li').not(this).removeClass('active');
    $(this).addClass('active');
    // -- Hiding menu
    $('.menu, .menu-ico:not(.back)').removeClass('active');
    // -- Activiting the right page
    $('.content').removeClass('selected');
    //$(pageTitleC).not('.selected').addClass('selected');
    $(pageTitleC).addClass('selected');
    // -- Reset Body/title class and then add the right one
    $('body,#title').removeClass().addClass(pageTitle);
    // -- Adding the page name for page title
    $('#pageTitle').addClass('active').text(pageTitle);
});
// ========================================================= //


// Main Tabs
// ========================================================= //
$('#title').on('click', 'li', function () {
    var tabTitle = $(this).attr('class').replace(/ |active/g, ''),
        tabTitleC = '.' + tabTitle;
    // -- Just a simple jquery tab
    $('#title li').not(this).removeClass('active');
    $(this).addClass('active');
    $('.content .tab').removeClass('active')
    $(tabTitleC).addClass('active');
});
// ========================================================= //


// Share Box [Just Open]
// ========================================================= //
$('.bottom').on('click', '.share-btn', function (b) {
    $('.share-box').toggleClass('active');
});
$('.share-box').on('click', '.close-btn', function (b) {
    $('.share-box').toggleClass('active');
});
// ========================================================= //


// Instent Search
// ========================================================= //
$('#search').keyup(function () {
    var thisVal = $(this).val();
    // -- On input show the menu
    $('.menu,.menu-ico').addClass('active');
    // -- Showing / hidding Results and Menu list
    if ($(this).val() == 0) {
        $('.results-list').fadeOut();
        $('.menu-list').fadeIn();

    } else {
        $('.menu-list').fadeOut();
        $('.results-list').fadeIn();
    }
});
// ========================================================= //


// Results List Click fn
// ========================================================= //
$('.results-list').on('click', 'li', function () {
    var getResultID = $(this).attr('data-id');
    sP.play('#' + getResultID)
});
// ========================================================= //


// Others
// ========================================================= //
// -- Responsive fn (for electron)
function responsiveAlbums() {
    $('.album,.content,.tab').addClass('tempActive');
    var albumArtW = $('.album').width();
    $('.album,.genre,.content,.tab').removeClass('tempActive');

    $('.album .art, .genre .art').css({
        width: albumArtW,
        height: albumArtW
    });
    var albumLargeArtH = $('#box').width() - 40;
    $('.album-large .art').css({
        width: albumLargeArtH,
        height: albumLargeArtH
    })
}
responsiveAlbums()
window.addEventListener('resize', responsiveAlbums);

// -- Reseting Search
$('.header').on('click', '.menu-ico', function () {
    $('#search').val('');
    $('.results-list').fadeOut();
    $('.menu-list').fadeIn();
});

// -- toggle Mobile Version
$('.header').on('click', '.more', function () {
    $(this).toggleClass('active');
    $('#box').toggleClass('m-ui');
    responsiveAlbums()
    //$('.menu').toggleClass('active');
});

// -- toggle bottom controls for mobile
$('.bottom').on('click', '.more-btn', function () {
    $(this).toggleClass('active');
    $('.bottom').toggleClass('more-active');

});
// -- Search toggle only for mobile UI
$('body').on('click', '#box.m-ui .search-ico', function () {
    $(this).toggleClass('active');
    $('#title p').toggleClass('sActive');
});

// -- Clear fn for clear btn for music page
$('.clear-btn').click(function () {
    sP.clear('importStorage')
    $('#selectFiles').removeClass('changed');
    $('#iFiles').html('')
});
// ========================================================= //