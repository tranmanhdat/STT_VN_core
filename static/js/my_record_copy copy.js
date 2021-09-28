//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;

var gumStream; 						//stream from getUserMedia()
var rec; 							//Recorder.js object
var input; 							//MediaStreamAudioSourceNode we'll be recording

// shim for AudioContext when it's not avb.
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext; //audio context to help us record
var constraints = {audio: true, video: false};
var stream_obj = navigator.mediaDevices.getUserMedia(constraints);
$(document).ready(function() {
    $("#success-alert").hide();
  });

var next = true;
setInterval(function() {
    if(next === true) {
        action.innerHTML = "YÊN LẶNG QUÁ, NÓI ĐI NÀO!";
        runSpeechRecognition();
    }
}, 0);

function startRecording() {
    console.log("start recording");
    var constraints = {audio: true, video: false};
    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
        // console.log("getUserMedia() success, stream created, initializing Recorder.js ...");
        audioContext = new AudioContext();
        /*  assign to gumStream for later use  */
        gumStream = stream;
        /* use the stream */
        input = audioContext.createMediaStreamSource(stream);
        /*
            Create the Recorder object and configure to record mono sound (1 channel)
            Recording 2 channels  will double the file size
        */
        rec = new Recorder(input, {numChannels: 1});
//        //start the recording process
        // console.log("typeof rec");
        console.log(typeof rec);
        rec.record();

    }).catch(function (err) {
        //enable the record button if getUserMedia() fails
    });
//    rec.stop();
}

function stopRecording() {
//    rec = "stop recording"
    console.log("next");
    console.log(next);
    console.log("stop recording and save audio");
    //tell the recorder to stop the recording
    rec.stop();
    //stop microphone access
    gumStream.getAudioTracks()[0].stop();
    //create the wav blob and pass it on to createDownloadLink
    rec.exportWAV(createDownloadLink);
}



function createDownloadLink(blob) {
    console.log("exporting");
    var filename = ".wav";
//    if (Array.isArray(blob) && blob.length) {
    let xhr = new XMLHttpRequest();
    var fd = new FormData();
    fd.append("audio_data", blob, filename);
    xhr.onreadystatechange = function() { // Call a function when the state changes.
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            // Request finished. Do processing here.
            var myurl = "/speech_to_text";
            $.get(myurl, function(data, status){
                if(data === ""){
                    // setTimeout(function() { alert("Nói rõ lên nào!"); }, 2000);
                    $("#success-alert").fadeTo(2000, 500).slideUp(500, function(){
                        $("#success-alert").slideUp(500);
                    });
                    // alert("Nói rõ lên nào!");
                }else{
                    document.getElementById('text').value += data + " ";
                }
                next = true;
            });
        }
    }
    xhr.open("POST", "/save_audios", true);
    xhr.send(fd);
    
    // 
    // window.location = "/record_audio";
//    }else{
//        alert("Chưa đủ file thu âm!");
//    }
}
var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;

/* JS comes here */
function runSpeechRecognition() {
    // get output div reference
//    var output = document.getElementById("output");
    // get action element reference
//    var action = document.getElementById("action");
    // new speech recognition object
//    do{
    next = false;
    var recognition = new SpeechRecognition();
    // This runs when the speech recognition service starts
    // recognition.onspeechstart = function() {
    //     console.log('Speech has been detected');
    //   }
    // recognition.start();
    recognition.onspeechstart = function() {
        action.innerHTML = "<small>ĐANG LẮNG NGHE BẠN NÓI.</small>";
        startRecording();
    };
    recognition.onspeechend = function() {
        action.innerHTML = "<small>DỪNG LẮNG NGHE, HI VỌNG BẠN ĐÃ NÓI XONG - ĐANG SPEECH TO TEXT....</small>";
        recognition.abort();
        stopRecording();
    };

    // This runs when the speech recognition service returns result
    // recognition.onresult = function(event) {
    //     var transcript = event.results[0][0].transcript;
    //     var confidence = event.results[0][0].confidence;
    //     output.innerHTML = "<b>Text:</b> " + transcript + "<br/> <b>Confidence:</b> " + confidence*100+"%";
    //     output.classList.remove("hide");
    // };

     // start recognition
     recognition.start();
//         console.log(next);
//    }while(1==1);
}