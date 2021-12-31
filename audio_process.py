from pydub import AudioSegment
from pydub.silence import split_on_silence
from pydub.utils import make_chunks
from pydub.effects import normalize
import sys
import os

def convert_to_wav(filepath):
    print("converting....")
    new_name = filepath.rsplit(".", 1)[0] + ".wav"
    wav_file = AudioSegment.from_file(file=filepath)
    wav_file = wav_file.set_frame_rate(16000)
    wav_file = wav_file.set_sample_width(2)
    wav_file = wav_file.set_channels(1)
    wav_file.export(new_name, format='wav')
    return new_name

def match_target_amplitude(aChunk, target_dBFS):
    ''' Normalize given audio chunk '''
    change_in_dBFS = target_dBFS - aChunk.dBFS
    return aChunk.apply_gain(change_in_dBFS)

def process_file(filepath):
    new_name = convert_to_wav(filepath)
    base_name = new_name.rsplit(".", 1)[0]
    os.makedirs(base_name, exist_ok=True)
    audio = AudioSegment.from_wav(new_name)
    audio_chunks = split_on_silence(audio, min_silence_len=1000, silence_thresh=-40, keep_silence=300)
    print(len(audio_chunks))
    audio_path_list = []
    min_length = 7*1000
    max_length = 15*1000
    overlap = 0*1000
    output_chunks = []
    while(len(audio_chunks) > 0):
        chunk = audio_chunks.pop(0)
        chunk_length = len(chunk)
        if min_length < chunk_length < max_length:
            output_chunks.append(chunk)
        elif chunk_length > max_length:
            split_chunks = []
            split_chunks.append(chunk[:min_length])
            i = min_length
            while(i+min_length+overlap<len(chunk) and i+2*min_length<len(chunk)):
                split_chunks.append(chunk[i-overlap:i+min_length+overlap])
                i = i + min_length
            split_chunks.append(chunk[i:])
            output_chunks = output_chunks + split_chunks
        elif chunk_length < min_length:
            if len(audio_chunks) > 0:
                next_chunk = audio_chunks.pop(0)
                audio_chunks.insert(0, chunk + next_chunk)
            else:
                output_chunks.append(chunk)
    for idx, chunk in enumerate(output_chunks):
        chunk_name = os.path.join(base_name,"chunk{0}.wav".format(idx))
        # normalized_chunk = match_target_amplitude(chunk, -20.0)
        # normalized_chunk.export(chunk_name, format="wav")
        chunk = normalize(chunk)
        chunk.export(chunk_name, format="wav")
        audio_path_list.append(chunk_name)
    return audio_path_list

def merger_texts(texts):
    result = []
    for i, text in enumerate(texts):
        if len(text)==0:
            continue
        if i == 0:
            result = result + text.split(" ")
        else:
            elements = text.split(" ")
            if result[-1] == elements[0]:
                result = result + elements[1:]
            else:
                result = result + elements
    return " ".join(result)

if __name__ == "__main__":
    process_file(sys.argv[1])