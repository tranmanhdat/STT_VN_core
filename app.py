from flask import Flask, request
from flask import render_template
from fl_service import FlashlightModel
import sys, os
from pydub import AudioSegment

app = Flask(__name__)
app.secret_key = "abc_xyz"
model_path = None
w2l = None
app.config['UPLOAD_FOLDER'] = os.getcwd() + '/static/audios/'
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.mkdir(app.config['UPLOAD_FOLDER'])

@app.route("/", methods=['POST', 'GET'])
def index():
    return render_template("demo.html")
def convert_to_wav(filepath):
    print("converting....")
    new_name = filepath.split(".")[0]+"_.wav"
    wav_file = AudioSegment.from_file(file=filepath)
    wav_file = wav_file.set_frame_rate(16000)
    wav_file = wav_file.set_sample_width(2)
    wav_file = wav_file.set_channels(1)
    wav_file.export(new_name, bitrate="256", format='wav')
    return new_name
@app.route('/recog', methods=['GET', 'POST'])
def recog_file():
    if request.method == 'POST':
        static_file = request.files['the_file']
        # here you can send this static_file to a storage service
        # or save it permanently to the file system
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], static_file.filename)
        static_file.save(file_path)
        if file_path.split(".")[-1] != "wav":
            file_path = convert_to_wav(file_path)
        text = w2l.process_file(file_path)
        return text

if __name__ == "__main__":
    model_path = sys.argv[1]
    w2l = FlashlightModel(model_path)
    app.debug = True
    # app.run(host="0.0.0.0", port=5555, ssl_context=('cert.pem', 'key.pem'))
    app.run(host="0.0.0.0", port=5555, use_reloader=False, ssl_context=('cert.pem', 'key.pem'))