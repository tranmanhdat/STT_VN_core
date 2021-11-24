import os
import signal
import sys
from subprocess import Popen, PIPE


def read_current_output(process):
    while True:
        output = process.stderr.readline()
        print(output.decode().strip())
        if "Waiting the input in the format" in output.decode():
            break;


def create_process(cmd):
    process = Popen([cmd],
                    stdin=PIPE, stdout=PIPE, stderr=PIPE,
                    shell=True, preexec_fn=os.setsid)
    read_current_output(process)
    return process


def run_inference(audio_path, process):
    process.stdin.write("{}\n".format(audio_path).encode())
    process.stdin.flush()
    read_current_output(process)


"""### Run the inference process with a model
We are using best parameters we found on validation sets of training data with a language model we provide in this tutorial. You can play with `beam_size` (increasing it, but inference time will increse too), `lm_weight` and `word_score`
"""

# you can switch here to small model am_conformer_ctc_stride3_letters_25Mparams.bin
# set for it also lm_weight=2 and word_score=0
model_path = './model_A100'
w2l_bin = "/root/flashlight/build/bin/asr/fl_asr_tutorial_inference_ctc"

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
          --word_score=0""" % (w2l_bin, os.path.join(model_path, "am.bin"),
                               os.path.join(model_path, "train-all-unigram-8294.tokens"),
                               os.path.join(model_path, "unigram-8294-nbest10.lexicon"),
                               os.path.join(model_path, "lm.bin"))

audio_file = sys.argv[1]
print("recognizing ", audio_file)
inference_process = create_process(inference_cmd)
run_inference(audio_file, inference_process)
os.killpg(os.getpgid(inference_process.pid), signal.SIGTERM)
