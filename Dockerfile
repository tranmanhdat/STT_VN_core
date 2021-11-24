FROM flml/flashlight:cuda-8f7af9e
RUN apt update && apt install -y ffmpeg
RUN pip3 install flask pydub flask_session
WORKDIR /root