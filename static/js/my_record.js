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

// var next = true;
// setInterval(function() {
//     if(next === true) {
//         action.innerHTML = "YÊN LẶNG QUÁ, NÓI ĐI NÀO!";
//         runSpeechRecognition();
//     }
// }, 0);

function startRecording() {
    action.innerHTML = "<small>ĐANG LẮNG NGHE BẠN NÓI.</small>";
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
    action.innerHTML = "<small>DỪNG LẮNG NGHE, ĐANG SPEECH TO TEXT....</small>";
    // console.log("next");
    // console.log(next);
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
                    document.getElementById('text').value = data + " ";
                    action.innerHTML = "<small>X Ử LÝ XONG - NHẤN START ĐỂ TIẾP TỤC</small>";
                }
                // next = true;
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
