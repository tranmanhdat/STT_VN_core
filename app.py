from flask import Flask, request
from flask import render_template
from fl_service import FlashlightModel
import sys, os
from audio_process import process_file, merger_texts
import argparse

app = Flask(__name__)
app.secret_key = "abc_xyz"
model_path = None
w2l = None
app.config['UPLOAD_FOLDER'] = os.getcwd() + '/static/audios/'
transcript_file = os.getcwd() + '/static/transcript.txt'
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.mkdir(app.config['UPLOAD_FOLDER'])

@app.route("/", methods=['POST', 'GET'])
def index():
    return render_template("demo.html")


@app.route('/recog', methods=['GET', 'POST'])
def recog_file():
    if request.method == 'POST':
        static_file = request.files['the_file']
        # here you can send this static_file to a storage service
        # or save it permanently to the file system
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], static_file.filename)
        static_file.save(file_path)
        # if file_path.split(".")[-1] != "wav":
        audio_path_list = process_file(file_path)
        texts = []
        for audio_path in audio_path_list:
            texts.append(w2l.process_file(audio_path))
        text = merger_texts(texts)
        global transcript_file
        with open(transcript_file, "a+", encoding="UTF-8") as f_write:
            f_write.write(file_path+"\t"+text+"\n")
        return text

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-m", "--model_path", type=str, default=None, help="model path", required=True)
    parser.add_argument("-p", "--port", type=int, default=5555, help="port")
    parser.add_argument("-d", "--debug", action="store_true", help="debug mode", default=True)
    parser.add_argument("-t", "--type", type=int, default=0, help="type of language run, 0 for vn and en, 1 for vn, 2 for en")
    args = parser.parse_args()
    # model_path = args.model_path
    w2l = FlashlightModel(args.model_path, args.type)
    app.debug = args.debug
    app.run(host="0.0.0.0", port=args.port)
    # app.run(host="0.0.0.0", port=5555, ssl_context=('cert.pem', 'key.pem'))
    # app.run(host="0.0.0.0", port=5555, use_reloader=False, ssl_context=('cert.pem', 'key.pem'))