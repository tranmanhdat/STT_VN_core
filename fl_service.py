from flask import Flask

app = Flask(__name__)
import os
import signal
from subprocess import Popen, PIPE


class FlashlightModel:
    def __init__(self, model_path, type=0):
        self.w2l_bin = "/root/flashlight/build/bin/asr/fl_asr_tutorial_inference_ctc"
        if type==0 or type==1:
            self.vn_model_path = os.path.join(model_path, "vn_model")
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
                    --lm_weight=1.0 \
                    --word_score=0""" % (self.w2l_bin, os.path.join(self.vn_model_path, "am.bin"),
                                        os.path.join(self.vn_model_path, "unigram.tokens"),
                                        os.path.join(self.vn_model_path, "unigram_nbest10.lexicon"),
                                        os.path.join(self.vn_model_path, "lm.bin")
                                        )
            self.asr_process_vn = self.create_process(inference_cmd)
        if type==0 or type==2:
            self.en_model_path = os.path.join(model_path, "en_model")
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
                    --lm_weight=1.0 \
                    --word_score=0""" % (self.w2l_bin, os.path.join(self.en_model_path, "am_transformer_ctc_stride3_letters_70Mparams.bin"),
                                        os.path.join(self.en_model_path, "tokens.txt"),
                                        os.path.join(self.en_model_path, "lexicon.txt"),
                                        os.path.join(self.en_model_path, "lm_common_crawl_small_4gram_prun0-6-15_200kvocab.bin")
                                        )
            self.asr_process_en = self.create_process(inference_cmd)
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

    def process_file(self, audio_path, type=1):
        if type==1:
            self.asr_process_vn.stdin.write("{}\n".format(audio_path).encode())
            self.asr_process_vn.stdin.flush()
            text = ''
            while True:
                output = self.asr_process_vn.stderr.readline().decode().rstrip()
                if "predicted output for" in output:
                    continue
                if "Waiting the input in the format" in output:
                    break
                text = text + output
        elif type==2:
            self.asr_process_en.stdin.write("{}\n".format(audio_path).encode())
            self.asr_process_en.stdin.flush()
            text = ''
            while True:
                output = self.asr_process_en.stderr.readline().decode().rstrip()
                if "predicted output for" in output:
                    continue
                if "Waiting the input in the format" in output:
                    break
                text = text + output
        else:
            return None
        return text

    def kill_process(self):
        os.killpg(os.getpgid(self.asr_process.pid), signal.SIGTERM)

if __name__ == '__main__':
    import sys
    model_path = sys.argv[1]
    audio_path = sys.argv[2]
    w2l = FlashlightModel(model_path)
    print('output=', w2l.process_file(audio_path))
