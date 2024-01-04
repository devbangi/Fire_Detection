# RP dockerfile
FROM node:14

# you can specify python version during image build
ARG PYTHON_VERSION=3.10.9

WORKDIR /File_Upload_App

RUN apt-get update

# install build dependencies and needed tools
RUN apt-get install -y \
    wget \
    gcc \
    make \
    zlib1g-dev \
    libffi-dev \
    libssl-dev \
    musl-dev 

# download and extract python sources
RUN cd /opt \
    && wget https://www.python.org/ftp/python/${PYTHON_VERSION}/Python-${PYTHON_VERSION}.tgz \                                              
    && tar xzf Python-${PYTHON_VERSION}.tgz

# build python and remove left-over sources
RUN cd /opt/Python-${PYTHON_VERSION} \ 
    && ./configure --prefix=/usr --enable-optimizations --with-ensurepip=install \
    && make install \
    && rm /opt/Python-${PYTHON_VERSION}.tgz /opt/Python-${PYTHON_VERSION} -r

RUN apt-get install libgdal-dev -y 
RUN apt-get install python-pip -y
RUN pip install rasterio
RUN pip3 install --upgrade pip
RUN pip3 install rasterio 
RUN pip3 install opencv-python
RUN apt-get install -y libgl1-mesa-glx
RUN pip3 install pandas
RUN pip3 install matplotlib
RUN pip3 install scikit-learn
RUN pip3 install tensorflow 
COPY package*.json .
RUN npm install
COPY . .
EXPOSE 3000
STOPSIGNAL SIGTERM
CMD ["npm", "start"]