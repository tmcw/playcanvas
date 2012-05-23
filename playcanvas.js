

function playcanvas(canvas_ctx) {
  if (!window.webkitAudioContext) {
    throw new Exception('webkitAudioContext not available');
  }

  var p = {},
      audio_ctx,
      canvas_ctx,
      processor,
      note_time,
      nindex = 0;

  var PI2 = Math.PI * 2,
      phase = 0.0,
      baseFrequency = 440.0,
      sampleRate = 44100.0,
      bufferSize = 2048, // must be power of 2
      phaseIncrement = PI2 * baseFrequency / sampleRate,
      ctx, jsProcessor,
      soundEnabled = false;

  // This function will be called repeatedly to fill an audio buffer and
  // generate sound.
  function process(event) {
      // Get array associated with the output port.
      var outputArray = event.outputBuffer.getChannelData(0);
      var n = outputArray.length;

      if (soundEnabled) {
          for (var i = 0; i < n; ++i) {
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
          for (var i = 0; i < n; ++i) {
              outputArray[i] = 0.0;
          }
      }
  }

  function initialize_audio() {
    audio_ctx = new webkitAudioContext(),
    processor = audio_ctx.createJavaScriptNode(2048, 0, 1);
    processor.onaudioprocess = process;
    processor.connect(audio_ctx.destination);
  }

  function initialize_canvas() {
    // canvas_ctx = canvas.getContext('2d');
    canvas_data = canvas_ctx.getImageData(0, 0, 200, 60);
  }

  var canvas_width = 200, canvas_height = 30;

  function getpx(data, x, y) {
     var r = data[4 * ((y * canvas_width) + x) + 0],
         g = data[4 * ((y * canvas_width) + x) + 1],
         b = data[4 * ((y * canvas_width) + x) + 2],
         a = data[4 * ((y * canvas_width) + x) + 3];
    return [r, g, b, a];
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
    var px = getpx(canvas_data.data, nindex % canvas_width, Math.floor(nindex / canvas_width));
    flippx(canvas_ctx, canvas_data.data, nindex % canvas_width, Math.floor(nindex / canvas_width));
    phaseIncrement = PI2 * (px[0] + px[1] + px[2]) / sampleRate;
    nindex++;
    if (nindex < (canvas_width * canvas_height)) {
      note_time = window.setTimeout(play_note, 0);
    } else {
      soundEnabled = false;
    }
  }

  p.play = function() {
    note_time = play_note();
  }

  initialize_audio();
  initialize_canvas();

  return p;
}


function playNote(note) {
    x = 3;
    y = symbols.indexOf(note);
    a = Math.pow(2, x);
    b = Math.pow(1.059463, y);
    Z = Math.round(275 * a * b) / 10;
    phaseIncrement = PI2 * Z / sampleRate;
    soundEnabled = true;
}
