#STAGE 1 to clone the repo
FROM alpine/git:latest
WORKDIR /clone-workspace
RUN git clone https://github.com/owainow/ml-on-aca.git

# STAGE 2 to build the image
FROM python:3.7.3-stretch
# Make working directories & copy content from stage 1
RUN  mkdir -p  /food-vision-api
COPY --from=0  /clone-workspace/ /food-vision-api/
WORKDIR  /food-vision-api/ml-on-aca/aca/backend-ml

# Upgrade pip with no cache
RUN pip install --no-cache-dir -U pip

# Copy application requirements file to the created working directory
COPY requirements.txt .

# Install application dependencies from the requirements file
RUN pip install -r requirements.txt

# Copy every file in the source folder to the created working directory
COPY  . .

# Run the python application
CMD ["python", "main.py"]