//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;

var gumStream; 						//stream from getUserMedia()
var rec; 							//Recorder.js object
var input; 							//MediaStreamAudioSourceNode we'll be recording

// shim for AudioContext when it's not avb.
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext; //audio context to help us record
var arrRecordButton = [];
var arrStopButton = [];
var cur_id;
var arrBlob = [];
var fileNames = [];

var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");
arrRecordButton.push(recordButton);
arrStopButton.push(stopButton);

arrRecordButton[0].addEventListener("click", function () {
    startRecording(0);
}, false);
arrStopButton[0].addEventListener("click", function () {
    stopRecording(0);
}, false);


function startRecording(stt) {
    console.log("recordButton " + stt + " clicked");
    var constraints = {audio: true, video: false};
    arrRecordButton[stt].disabled = true;
    arrStopButton[stt].disabled = false;
    // pauseButton.disabled = false
    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
        console.log("getUserMedia() success, stream created, initializing Recorder.js ...");
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
        //start the recording process
        rec.record();
    }).catch(function (err) {
        //enable the record button if getUserMedia() fails
        arrRecordButton[stt].disabled = false;
        arrStopButton[stt].disabled = true;
        // pauseButton.disabled = true
    });
}


function stopRecording(_id) {
    console.log("stopButton clicked");
    //disable the stop button, enable the record too allow for new recordings
    arrStopButton[_id].disabled = true;
    arrRecordButton[_id].disabled = false;
    // pauseButton.disabled = true;
    //reset button just in case the recording is stopped while paused
    // pauseButton.innerHTML = "Pause";
    //tell the recorder to stop the recording
    rec.stop();
    //stop microphone access
    gumStream.getAudioTracks()[0].stop();
    //create the wav blob and pass it on to createDownloadLink
    cur_id = _id;
    rec.exportWAV(createDownloadLink);
}



function createDownloadLink(blob) {
    console.log("current id : "+id[cur_id]);
    var filename = user_name+"_"+id[cur_id]+".wav";
    fileNames[cur_id] = filename;
    arrBlob[cur_id] = blob;
    let url = URL.createObjectURL(blob);
    let au = document.createElement('audio');
    // var li = document.createElement('li');
    // var link = document.createElement('a');
    //name of .wav file to use during upload and download (without extendion)
    //add controls to the <audio> element
    au.controls = true;
    au.src = url;
    var theDiv = document.getElementById("colWav_"+cur_id);
    theDiv.innerHTML = '';
    theDiv.append(au);
}

function upload() {
    if (Array.isArray(arrBlob) && arrBlob.length && arrBlob.length == id.length) {
        let xhr = new XMLHttpRequest();
        var fd = new FormData();
        // fd.append("audio_data", arrBlob[0], fileNames[0]);
        for (let j=0;j<id.length;j++){
            fd.append("audio_data", arrBlob[j], fileNames[j]);
            // alert(fileNames[j]);
            // console.log(fileNames[j]);
        }
        xhr.open("POST", "http://127.0.0.1:5000/save_audios", true);
        xhr.send(fd);
        alert("tải lên thành công");
        window.location = "/";
}
    else{
        alert("Chưa đủ file thu âm!");
    }
}