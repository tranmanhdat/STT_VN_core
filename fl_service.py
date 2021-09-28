from flask import Flask

app = Flask(__name__)
import os
import signal
from subprocess import Popen, PIPE


class FlashlightModel:
    def __init__(self, model_path):
        self.model_path = model_path
        self.w2l_bin = "/root/flashlight/build/bin/asr/fl_asr_tutorial_inference_ctc"
        inference_cmd = """%s \
                  --am_path=%s \
                  --tokens_path=%s \
                  --lexicon_path=%s \
                  --lm_path=%s \
                  --logtostderr=true \
                  --sample_rate=16000 \
                  --beam_size=50 \
                  --beam_size_token=30 \
                  --beam_threshold=100 \
                  --lm_weight=1.5 \
                  --word_score=0""" % (self.w2l_bin, os.path.join(self.model_path, "002_model_last.bin"),
                                       os.path.join(self.model_path, "train-all-unigram-3557.tokens"),
                                       os.path.join(self.model_path, "unigram-3557-nbest10.lexicon"),
                                       os.path.join(self.model_path, "lm.bin")
                                       )
        # print(inference_cmd)
        self.asr_process = self.create_process(inference_cmd)
        # time.sleep()
    def read_current_output(self, process):
        text =''
        while True:
            output = process.stderr.readline()
            text += output.decode()
            if "Waiting the input in the format" in output.decode():
                break
        return text

    def create_process(self, cmd):
        process = Popen([cmd],
                        stdin=PIPE, stdout=PIPE, stderr=PIPE,
                        shell=True, preexec_fn=os.setsid)
        self.read_current_output(process)
        return process

    def process_file(self,audio_path):
        self.asr_process.stdin.write("{}\n".format(audio_path).encode())
        self.asr_process.stdin.flush()
        text = ''
        while True:
            output = self.asr_process.stderr.readline().decode().rstrip()
            if "predicted output for" in output:
                continue
            if "Waiting the input in the format" in output:
                break
            text = text + output
        return text

    def kill_process(self):
        os.killpg(os.getpgid(self.asr_process.pid), signal.SIGTERM)

if __name__ == '__main__':
    import sys
    model_path = sys.argv[1]
    audio_path = sys.argv[2]
    w2l = FlashlightModel(model_path)
    print('output=', w2l.process_file(audio_path))
