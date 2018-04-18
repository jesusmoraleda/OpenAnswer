// Taken (and slightly modified) from https://github.com/brianjgeiger/markdown-it-video on July 30th, 2017.
// Process @[yt](youtubeVideoID)
;(function (root, factory) {
    root.markdownitVideo = factory()
})(this, function () {

    var yt_regex = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;

    function youtube_parser(url) {
        var match = url.match(yt_regex);
        return match && match[7].length === 11 ? match[7] : url;
    }

    var EMBED_REGEX = /@\[([a-zA-Z].+)\]\([\s]*(.*?)[\s]*[\)]/im;

    function video_embed(md, options) {
        function video_return(state, silent) {
            var serviceEnd,
                serviceStart,
                token,
                oldPos = state.pos;

            if (state.src.charCodeAt(oldPos) !== 0x40/* @ */ ||
                state.src.charCodeAt(oldPos + 1) !== 0x5B/* [ */) {
                return false;
            }

            var match = EMBED_REGEX.exec(state.src);

            if (!match || match.length < 3) {
                return false;
            }

            var service = match[1];
            var videoID = match[2];
            var serviceLower = service.toLowerCase();

            if (serviceLower === 'yt') {
                videoID = youtube_parser(videoID);
            } else if (!options[serviceLower]) {
                return false;
            }

            // If the videoID field is empty, regex currently make it the close parenthesis.
            if (videoID === ')') {
                videoID = '';
            }

            serviceStart = oldPos + 2;
            serviceEnd = md.helpers.parseLinkLabel(state, oldPos + 1, false);

            //
            // We found the end of the link, and know for a fact it's a valid link;
            // so all that's left to do is to call tokenizer.
            //
            if (!silent) {
                state.pos = serviceStart;
                state.posMax = serviceEnd;
                state.service = state.src.slice(serviceStart, serviceEnd);
                var newState = new state.md.inline.State(service, state.md, state.env, []);
                newState.md.inline.tokenize(newState);

                token = state.push('video', '');
                token.videoID = videoID;
                token.service = service;
                token.level = state.level;
            }

            state.pos = state.pos + state.src.indexOf(')', state.pos);
            state.posMax = state.tokens.length;
            return true;
        }

        return video_return;
    }

    function video_url(service, videoID, options) {
        switch (service) {
            case 'yt':
                return '//www.youtube.com/embed/' + videoID;
        }
    }

    function tokenize_video(md, options) {
        function tokenize_return(tokens, idx) {
            var videoID = md.utils.escapeHtml(tokens[idx].videoID);
            var service = md.utils.escapeHtml(tokens[idx].service).toLowerCase();
            return videoID === '' ? '' :
                '<div class="embed-responsive embed-responsive-16by9"><iframe class="embed-responsive-item" id="' +
                service + 'player" type="text/html" width="' + (options[service].width) +
                '" height="' + (options[service].height) +
                '" src="' + options.url(service, videoID, options) +
                '" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe></div>';
        }

        return tokenize_return;
    }

    function extend(options, defaults) {
        return Object.keys(defaults).reduce(function (result, key) {
            if (result[key] === undefined) {
                result[key] = defaults[key]
            }
            return result
        }, options)
    }

    return function (options) {
        var defaults = {
            url: video_url,
            yt: {width: 160, height: 200},
        };

        options = extend(options || {}, defaults)

        return function (md) {
            if (options) {
                Object.keys(defaults).forEach(function (key) {
                    if (typeof options[key] === 'undefined') {
                        options[key] = defaults[key];
                    }
                });
            } else {
                options = defaults;
            }
            md.renderer.rules.video = tokenize_video(md, options);
            md.inline.ruler.before('emphasis', 'video', video_embed(md, options));
        }
    }
});