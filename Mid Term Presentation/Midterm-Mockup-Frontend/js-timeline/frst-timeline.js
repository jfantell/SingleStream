! function(t) {
    "use strict";
    t(document).ready(function() {
        function n(n, i) {
            n.each(function() {
                var n = t(this).data("animation");
                t(this).find(".frst-timeline-content").addClass("is-hidden").removeClass("animated " + n), "" == t("#select-animation").val() && t(this).find(".frst-timeline-content").removeClass("is-hidden")
            })
        }

        function i(n, i) {
            n.each(function() {
                if (t("#select-animation").val()) t(this).offset().top <= t(window).scrollTop() + t(window).height() * i && t(this).find(".frst-timeline-content").hasClass("is-hidden") && t(this).find(".frst-timeline-content").removeClass("is-hidden").addClass("animated " + t("#select-animation").val());
                else {
                    var n = t(this).data("animation");
                    n && t(this).offset().top <= t(window).scrollTop() + t(window).height() * i && t(this).find(".frst-timeline-content").hasClass("is-hidden") && t(this).find(".frst-timeline-content").removeClass("is-hidden").addClass("animated " + n)
                }
            })
        }

        function e(n, i) {
            var e = 0;
            n.each(function() {
                var n = t(this).data("animation");
                if (n && t(window).scrollTop() + t(window).height() * i > t(this).offset().top && t(this).find(".frst-timeline-content").hasClass("is-hidden")) {
                    var a = t(this);
                    setTimeout(function() {
                        a.find(".frst-timeline-content").removeClass("is-hidden").addClass("animated " + t("#select-animation").val())
                    }, e)
                }
                e += 200
            })
        }
        var a = t(".frst-timeline-block"),
            s = .8;
        n(a, s), e(a, s), t(window).on("scroll", function() {
            window.requestAnimationFrame ? window.requestAnimationFrame(function() {
                i(a, s)
            }) : setTimeout(function() {
                i(a, s)
            }, 100)
        }), t(document).on("click", ".switch-btn", function(n) {
            n.preventDefault(), t(".header-style-options").slideToggle()
        }), t(document).on("click", ".style-class-switch a", function(n) {
            n.preventDefault();
            var i = t(this).data("styleclass");
            t(".style-class-switch li").removeClass("active"), t(this).parent().addClass("active"), t(".frst-timeline").removeClass("frst-alternate frst-right-align frst-left-align"), t(".frst-timeline").addClass("frst-" + i), t(".frst-container").removeClass("content-alternate content-right-align content-left-align"), t(".frst-container").addClass("content-" + i)
        }), t(document).on("change", "#select-animation", function() {
            var i = this.value;
            n(a, s), window.requestAnimationFrame ? window.requestAnimationFrame(function() {
                e(a, s)
            }) : setTimeout(function() {
                e(a, s)
            }, 300), t(".frst-timeline-block").data("animation", i)
        }), t(".frst-date").length && t(".check-style").show(), t("#dateToggle").change(function() {
            t(".frst-timeline").toggleClass("frst-date-opposite", this.checked)
        }).change()
    })
}(jQuery);
