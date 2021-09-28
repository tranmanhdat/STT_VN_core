//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;

var gumStream; 						//stream from getUserMedia()
var recorder; 						//WebAudioRecorder object
var input; 							//MediaStreamAudioSourceNode  we'll be recording
var encodingType; 					//holds selected encoding for resulting audio (file)
var encodeAfterRecord = true;       // when to encode
var isRecord = false
var id;
// shim for AudioContext when it's not avb. 
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext; //new audio context to help us record

// stopButton.addEventListener("click", stopRecording);
function collectButtonClicked() {
    id = event.toElement.name;
	if(!isRecord) {
		startRecording(event.toElement);
        isRecord = true;
	} else {
		stopRecording(event.toElement);
		isRecord = false;
	}
}
function startRecording(element) {
	console.log("startRecording() called");
	  
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
		console.log("getUserMedia() success, stream created, initializing WebAudioRecorder...");

		/*
			create an audio context after getUserMedia is called
			sampleRate might change after getUserMedia is called, like it does on macOS when recording through AirPods
			the sampleRate defaults to the one set in your OS for your playback device

		*/
		audioContext = new AudioContext();

		//assign to gumStream for later use
		gumStream = stream;
		
		/* use the stream */
		input = audioContext.createMediaStreamSource(stream);
		
		//stop the input from playing back through the speakers
		//input.connect(audioContext.destination)

		//get the encoding 
		encodingType = "wav";
		
		recorder = new WebAudioRecorder(input, {
		  workerDir: "/static/js/", // must end with slash
		  encoding: encodingType,
		  numChannels:1, //2 is the default, mp3 encoding supports only 2
		  onEncoderLoading: function(recorder, encoding) {
		    // show "loading encoder..." display
		    console.log("Loading "+encoding+" encoder...");
		  },
		  onEncoderLoaded: function(recorder, encoding) {
		    // hide "loading encoder..." display
		    console.log(encoding+" encoder loaded");
		  }
		});
		recorder.onComplete = function(recorder, blob) { 
            console.log("Encoding complete");
			createDownloadLink(blob,recorder.encoding);
		}

		recorder.setOptions({
		  timeLimit:120,
		  encodeAfterRecord:encodeAfterRecord,
	      ogg: {quality: 0.5},
	      mp3: {bitRate: 160}
	    });

		//start the recording process
		recorder.startRecording();

		console.log("Recording started");

	}).catch(function(err) {
	  	//enable the record button if getUSerMedia() fails
    	// recordButton.disabled = false;
    	// stopButton.disabled = true;

    });
    
    element.disabled = false;
    element.innerText = "Stop";
    var btns = document.getElementsByClassName("rb")
    console.log(btns)
    for (var i = 0; i < btns.length; i++) {
        btns[i].disabled = true;
    }
    document.getElementsByName(id)[0].disabled = false;
    document.getElementsByName("c" + id)[0].disabled = false;
    document.getElementsByName("s" + id)[0].innerText = "Recording ...";
    document.getElementsByName("s" + id)[0].id = "status";
    
	//disable the record button
    // recordButton.disabled = true;
	// stopButton.disabled = false;
}

function stopRecording(element) {
	console.log("stopRecording() called");
	
	//stop microphone access
	gumStream.getAudioTracks()[0].stop();

	//disable the stop button
	// stopButton.disabled = true;
	// recordButton.disabled = false;
    element.innerText = "Record"
    document.getElementsByName("c" + id)[0].disabled = true;
    var btns = document.getElementsByClassName("rb")
    for (var i = 0; i < btns.length; i++) {
        btns[i].disabled = false;
    }
	//tell the recorder to finish the recording (stop recording + encode the recorded audio)
	recorder.finishRecording();

	console.log('Recording stopped');
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
	var upload = document.createElement('h2');
    upload.href="#";
    var xhr=new XMLHttpRequest();
    xhr.onload=function(e) {
        if(this.readyState === 4) {
            console.log("Server returned: ",e.target.responseText);
            var status = document.getElementsByName("s" + id)[0];
            status.innerText = e.target.responseText;
            if (e.target.responseText == "Save success") {
                status.id = "success";
            } else {
                status.id = "failed";
            }

        }
    };
    var fd=new FormData();
    fd.append("the_file",blob, filename);
    fd.append('id', id);
    fd.append('file_name', filename);
    xhr.open("POST","/upload",true);
    xhr.send(fd);
	//add the new audio and a elements to the li element
	li.appendChild(au);
	li.appendChild(upload);
	//add the li element to the ordered list
}

function cancelButtonClicked() {
    //stop microphone access
	gumStream.getAudioTracks()[0].stop();
    isRecord = false;
    document.getElementsByName(id)[0].innerText = "Record"
    document.getElementsByName("c" + id)[0].disabled = true;
    var btns = document.getElementsByClassName("rb")
    for (var i = 0; i < btns.length; i++) {
        btns[i].disabled = false;
    }
    document.getElementsByName("s"+id)[0].innerText = "Canceled";
    recorder.cancelRecording();
}
