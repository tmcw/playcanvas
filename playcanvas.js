function playcanvas(canvas) {
    if (!window.webkitAudioContext) {
        throw 'webkitAudioContext not available';
    }

    var p = {},
        audio_ctx,
        canvas_ctx,
        canvas_data,
        processor,
        note_time,
        repeat = false,
        nindex = 0;

    var PI2 = Math.PI * 2,
        phase = 0.0,
        baseFrequency = 440.0,
        sampleRate = 44100.0,
        bufferSize = 2048, // must be power of 2
        phaseIncrement = PI2 * baseFrequency / sampleRate,
        ctx,
        jsProcessor,
        style = 'scan',
        soundEnabled = false;

    // This function will be called repeatedly to fill an audio buffer and
    // generate sound.
    function process(event) {
        // Get array associated with the output port.
        var outputArray = event.outputBuffer.getChannelData(0);
        var n = outputArray.length;
        var i;

        if (soundEnabled) {
            for (i = 0; i < n; ++i) {
                // Generate a sine wave.
                var sample = Math.sin(phase);
                outputArray[i] = sample * 0.6;
                // Increment and wrap phase.
                phase += phaseIncrement;
                if (phase > PI2) {
                    phase -= PI2;
                }
            }
        } else {
            // Output silence.
            for (i = 0; i < n; ++i) {
                outputArray[i] = 0.0;
            }
        }
    }

    // Create a new audio context. This should be called only once.
    function initialize_audio() {
        audio_ctx = new webkitAudioContext(),
        processor = audio_ctx.createJavaScriptNode(2048, 0, 1);
        processor.onaudioprocess = process;
        processor.connect(audio_ctx.destination);
    }

    // Create a new canvas context. This should be called only once.
    function initialize_canvas() {
        canvas_ctx = canvas.getContext('2d');
        canvas_data = canvas_ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    function getpx(data, x, y) {
        var r = data[4 * ((y * canvas.width) + x) + 0],
            g = data[4 * ((y * canvas.width) + x) + 1],
            b = data[4 * ((y * canvas.width) + x) + 2];
        return [r, g, b];
    }

    var flippedpx;
    function flippx(ctx, data, x, y) {
        if (flippedpx) {
            ctx.fillStyle = 'rgba(' + flippedpx[2].join(',') + ')';
            ctx.fillRect(flippedpx[0], flippedpx[1], 1, 1);
        }
        flippedpx = [x, y, getpx(data, x, y)];
        ctx.fillStyle = '#000';
        ctx.fillRect(x, y, 1, 1);
    }

    function play_note() {
        soundEnabled = true;
        phaseIncrement = PI2 * styles[style].freqat(nindex) / sampleRate;
        nindex++;
        if (nindex < styles[style].n_notes()) {
            note_time = window.setTimeout(play_note, 0);
        } else if (repeat) {
            nindex = 0;
            note_time = window.setTimeout(play_note, 0);
        } else {
          console.log('done');
            // Stop any audio output
            soundEnabled = false;
            // Rewind to the beginning.
            nindex = 0;
        }
    }

    var styles = {}, style_params;

    styles.scan = {
        n_notes: function() {
            return canvas.width * canvas.height;
        },
        freqat: function(n) {
            var px = getpx(canvas_data.data, nindex % canvas.width, Math.floor(nindex / canvas.width));
            return (px[0] + px[1] + px[2]);
        }
    };

    styles.sweep = {
        n_notes: function() {
            return canvas.width;
        },
        freqat: function(n) {
            for (var y = 0; y < canvas.height; y++) {
              var px = getpx(canvas_data.data, n, y);
              if (px[1] !== 0) {
                return canvas.height - y;
              }
            }
            return 0;
        }
    };

    // set a style-specific parameter
    p.style_param = function(k, x) {
        if (!arguments.length) {
          return style_params[k];
        }
        style_params[k] = x;
        return p;
    };

    p.repeat = function(x) {
        if (!arguments.length) return repeat;
        repeat = x;
        return p;
    };

    p.update = function(x) {
        canvas_ctx = x;
        canvas_data = canvas_ctx.getImageData(0, 0, canvas.width, canvas.height);
        return p;
    };

    p.style = function(x) {
        if (!arguments.length) return style;
        if (typeof x == 'string') {
          if (!styles[x]) throw 'style ' + x + ' not found';
          style = x;
        } else {
          styles._user = x;
          style = '_user';
        }
        return p;
    };

    // Play a note
    p.play = function() {
        note_time = play_note();
    };

    // Pause playing
    p.pause = function() {
        window.clearTimeout(note_time);
    };

    // Stop playing
    p.stop = function() {
        p.pause();
        nindex = 0;
    };

    p.n_notes = function() {
        return styles[style].notes();
    };

    initialize_audio();
    initialize_canvas();

    return p;
}
