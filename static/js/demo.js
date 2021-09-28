//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;

var gumStream; 						//stream from getUserMedia()
var recorder; 						//WebAudioRecorder object
var input; 							//MediaStreamAudioSourceNode  we'll be recording
var encodingType; 					//holds selected encoding for resulting audio (file)
var encodeAfterRecord = true;       // when to encode
var isRecord = false

const SILENT_THRESHOLD = 1000;
const SILENT_DURATION = 2;
var isStop = true;
var ws;
var buffer;
var result;
var countSilentDuration = 0;
// shim for AudioContext when it's not avb. 
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext; //new audio context to help us record

var recordButton = document.getElementById("recordButton");
// var streamButton = document.getElementById("streamButton");
//add events to those 2 buttons
recordButton.addEventListener("click", recordButtonClicked);
// streamButton.addEventListener("click", connect);
var data;
function connect()
{
    if (!isStop) {
      closeWS();
      stop();
      return;
    } else {
		document.getElementById("textTrans").value = "";
	}
    start()

    if (!audioContext) {
        // audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContext = new AudioContext({sampleRate: 16000, sampleSize: 16});
        if (audioContext.state == 'suspended') {
          audioContext.resume();
        }
        navigator.mediaDevices.getUserMedia({ audio: true, video:false }).then(function (stream) {
            var audioInput = audioContext.createMediaStreamSource(stream);

            var bufferSize = 0;
    
            recorder = audioContext.createScriptProcessor(bufferSize, 1, 1);
    
            recorder.onaudioprocess = function (e) {
              if (!isStop && ws && ws.readyState == ws.OPEN) {
                // if (countSilentDuration > SILENT_DURATION) {
                //   closeWS();
                //   stop();
                //   countSilentDuration = 0;
                //   return;
                // }
    
                buffer = e.inputBuffer.getChannelData(0);
                // drawBuffer(buffer);
                var int16ArrayData = convertFloat32ToInt16(buffer);
                countSilentDuration += int16ArrayData.length / audioContext.sampleRate;
                for (var i = 0; i < int16ArrayData.length; i++) {
                  if (Math.abs(int16ArrayData[i]) > SILENT_THRESHOLD) {
                    countSilentDuration = 0;
                    break;
                  }
                }
				data = new Int16Array(data.length + int16ArrayData.length)
				data.set(data);
				data.set(int16ArrayData, data.length)
                ws.send(int16ArrayData.buffer);
              }
            };
            audioInput.connect(recorder);
        recorder.connect(audioContext.destination);
      }).catch(function (e) { console.log("Error in getUserMedia: "); console.log(e) });
    }
    initWebSocket(audioContext.sampleRate)
}

// function initWebSocket(sampleRate) {
//     start();
//     ws = new WebSocket('wss://10.0.55.82:8080');
//     ws.onopen = function () {
//       console.log("Opened connection to websocket");
//     };
//
//     ws.onclose = function () {
//       console.log("Websocket closed");
//       stop();
//     };
//
//     ws.onmessage = function (e) {
//         document.getElementById("textTrans").value += e.data
//     };
//
//     return ws
//   }

  // function start() {
	// isStop = false;
	// document.getElementById("streamButton").innerHTML = "Stop";
  // }

  // function stop() {
	// isStop = true;
	// document.getElementById("streamButton").innerHTML = "Record";
	// // document.getElementById("transcripted-text").value += "\n";
	// const blob = new Blob([data], { type: 'audio/wav' });
	// const url = URL.createObjectURL(blob);
  //
	// // Get DOM elements.
	// const audio = document.getElementById('audio');
	// const source = document.getElementById('source');
  //
	// // Insert blob object URL into audio element & play.
	// source.src = url;
	// audio.load();
	// audio.play();
  // }

  function closeWS() {
    // if (ws && ws.readyState == ws.OPEN) {
    //   ws.send("EOS");
    // }
    ws.close();
  }

  function convertFloat32ToInt16(float32ArrayData) {
    var l = float32ArrayData.length;
    var int16ArrayData = new Int16Array(l);
    while (l--) {
      int16ArrayData[l] = Math.min(1, float32ArrayData[l]) * 0x7FFF;
    }
    return int16ArrayData;
  }


function recordButtonClicked() {
	if(!isRecord) {
		startRecording();
		isRecord = true;
	} else {
		stopRecording();
		isRecord = false;
	}
}
function startRecording() {
	console.log("startRecording() called");
	clear_log()
	  
	/*
		Simple constraints object, for more advanced features see
		https://addpipe.com/blog/audio-constraints-getusermedia/
	*/
    
    var constraints = { audio: true, video:false }

    /*
    	We're using the standard promise based getUserMedia() 
    	https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
	*/

	navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
		__log("getUserMedia() success, stream created, initializing WebAudioRecorder...");

		/*
			create an audio context after getUserMedia is called
			sampleRate might change after getUserMedia is called, like it does on macOS when recording through AirPods
			the sampleRate defaults to the one set in your OS for your playback device

		*/
		audioContext = new AudioContext({sampleRate: 16000, sampleSize:16});

		//assign to gumStream for later use
		gumStream = stream;
		
		/* use the stream */
		input = audioContext.createMediaStreamSource(stream);
		
		//stop the input from playing back through the speakers
		//input.connect(audioContext.destination)


		recorder = new WebAudioRecorder(input, {
		  workerDir: "/static/js/", // must end with slash
		  encoding: "wav",
		  numChannels:1, //2 is the default, mp3 encoding supports only 2
		  onEncoderLoading: function(recorder, encoding) {
		    // show "loading encoder..." display
		    __log("Loading "+encoding+" encoder...");
		  },
		  onEncoderLoaded: function(recorder, encoding) {
		    // hide "loading encoder..." display
		    __log(encoding+" encoder loaded");
		  }
		});

		recorder.onComplete = function(recorder, blob) { 
			__log("Encoding complete");
			createDownloadLink(blob,recorder.encoding);
		}

		recorder.setOptions({
		  timeLimit:120,
		  encodeAfterRecord:"wav",
	      ogg: {quality: 0.5},
	      mp3: {bitRate: 160}
	    });

		//start the recording process
		recorder.startRecording();

		 __log("Recording started");

	}).catch(function(err) {
	  	//enable the record button if getUSerMedia() fails
    	// recordButton.disabled = false;
    	// stopButton.disabled = true;

	});

	//disable the record button
    // recordButton.disabled = true;
	// stopButton.disabled = false;
	recordButton.innerText = "Stop"
}

function stopRecording() {
	console.log("stopRecording() called");
	
	//stop microphone access
	gumStream.getAudioTracks()[0].stop();

	//disable the stop button
	// stopButton.disabled = true;
	// recordButton.disabled = false;
	recordButton.innerText = "Record"
	
	//tell the recorder to finish the recording (stop recording + encode the recorded audio)
	recorder.finishRecording();

	__log('Recording stopped');
}

function createDownloadLink(blob,encoding) {
	
	var url = URL.createObjectURL(blob);
	var au = document.createElement('audio');
	var li = document.createElement('li');
	var link = document.createElement('a');

	//add controls to the <audio> element
	au.controls = true;
	au.src = url;

	//link the a element to the blob
	filename = new Date().toISOString() + '.'+encoding
	link.href = url;
	link.download = filename;
	link.innerHTML = link.download;

	// excute command
    var xhr=new XMLHttpRequest();
    xhr.onload=function(e) {
        if(this.readyState === 4) {
			console.log("Server returned: ",e.target.responseText);
			document.getElementById("textTrans").value = e.target.responseText;
			document.getElementById("progress").style.display = 'none'
        }
    };
    var fd=new FormData();
    fd.append("the_file",blob, filename);
    xhr.open("POST","/recog",true);
	xhr.send(fd);
	document.getElementById("progress").style.display = 'block'
	//add the new audio and a elements to the li element
	li.appendChild(au);
	//add the li element to the ordered list
	while (recordAudio.hasChildNodes()) {
		recordAudio.removeChild(recordAudio.lastChild);
	}
	recordAudio.appendChild(li);
}



//helper function
function __log(e, data) {
	log.innerHTML += "\n" + e + " " + (data || '');
}

function clear_log(e) {
	log.innerHTML = "";
}

function triggerUpload()
{
	document.getElementById('wav').addEventListener('change', handleUploadFile, false);
	document.getElementById('mp3').addEventListener('change', handleUploadFile, false);
	document.getElementById('flac').addEventListener('change', handleUploadFile, false);
}
triggerUpload()
function handleUploadFile()
{
	const file =this.files[0]
	var au = document.createElement('audio');
	var li = document.createElement('li');
	//add controls to the <audio> element
	au.controls = true;
	au.src = URL.createObjectURL(file);
	li.appendChild(au)
	while (recordAudio.hasChildNodes()) {
		recordAudio.removeChild(recordAudio.lastChild);
	}
	recordAudio.appendChild(li);

	var xhr=new XMLHttpRequest();
    xhr.onload=function(e) {
        if(this.readyState === 4) {
			console.log("Server returned: ",e.target.responseText);
			document.getElementById("textTrans").value = e.target.responseText;
			document.getElementById("progress").style.display = 'none'
        }
    };
	var fd=new FormData();
    fd.append("the_file",file);
    xhr.open("POST","/recog",true);
	xhr.send(fd);
	document.getElementById("progress").style.display = 'block'
}
function uploadWav() {
	document.getElementById("wav").click();
}

function uploadMp3() {
	document.getElementById("mp3").click();
}

function uploadFlac() {
	document.getElementById("flac").click();
}