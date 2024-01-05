# Deploy a Machine Learning model on Azure Container Apps
A demo/workshop created to assist in deploying containerised ML workloads onto Azure Container Apps.


## Pre-Req's
First clone the repository into your working directory.

We can do this with the following command:

```
git clone https://github.com/owainow/ml-on-aca.git

```

To start the demo we require  a requirements .txt file outlining the packages required for this walk through. The packages are:

- FastAPI
- Numpy
- Uvicorn
- Image
- TensorFlow

The requirements.txt file can be found in the aca folder and installed with:

```
pip install -r requirements.txt

```

You will also need an Azure Subscription with the ability to deploy the following services:

- Azure Container Registry
- Azure Container Apps

## Create our Azure Resources

We will be creating our Azure resources using the CLI. Please ensure you are logged in and in the correct subscription. 

We first will need to create an Azure Container Registry in preparation for creating our two images. To do this with the CLI we can do the following:
```
ACR_NAME=<registry-name>
RES_GROUP=ml-aca
az login

az group create --resource-group $RES_GROUP --location eastus

az acr create --resource-group $RES_GROUP --name $ACR_NAME --sku Standard --location eastus --admin-enabled true

```

The admin enabled flag is required for some scenarios when deploying an image fro ACR to certain Azure Services including ACA.  

We then need to create our Container Apps enviroment. We will be using the consumption tier for this demo. To create our container apps enviroment we can run the following commands:

```

az containerapp env create -n MyContainerappEnvironment -g $RES_GROUP \
    --location eastus

```
This will be all that is required for now until we have our built container images.

## Create our ML Backend

The model we use in this demo aims to classify images of food that are passed to it. The image is passed directly through a URL and the image is then serialised for processing.

The ML model used in this demo is available from freecodecamp.org. We do not cover the training or packaging of the model in this guide. The notebook for training and packaging the model can be found here: https://github.com/eRuaro/food-vision-backend/blob/main/food_vision.ipynb

To save us the trouble of storing this model locally I have stored a version in a public Azure Storage blob. It is loaded directly by the main.py file from this URL: https://publicdemoresourcesoow.blob.core.windows.net/ml-models/food-vision-model.h5 we could alternatively also pull and store the model in the container image itself.

We will be using ACR tasks to build our image. ACR tasks provides cloud based container image building across platforms to simplify the image creation process. ACR tasks can use hosted or self hosted agents if required for private deployments. In this demo we will be using hosted agents. You can learn more about ACR tasks here: https://learn.microsoft.com/en-us/azure/container-registry/container-registry-tasks-overview

To use ACR tasks we will run the following commands in our terminal:

```
cd aca/backend-ml

az acr build --registry $ACR_NAME --image backendml:v1 --file Dockerfile .

```


## Create our Frontend

The frontend is built in react. It allows us to make a call to the API by passing in an image URL. The frontend then redirects us to the output of the model running on our other container. This showcases the full flow of the call. As a result this demo does not support a private deployment. We could however make an adjustment to the code so that the API call is made to the backend and instead of redirecting we display the return in the frontend. This would then support a private deployment of the backend. 

To build our frontend we will use ACR tasks. We can then build and push our image again:

```
cd ../frontend-ml

az acr build --registry $ACR_NAME --image frontendml:v1 --file Dockerfile .

```

## Deploy our Application

Now our container images are built and uploaded we can deploy our Azure Containers into our Container Apps environments. 

We will first create our ML Backend. To do this we need to create a container app associated with the environment we created earlier. We will do this in the portal so we understand some of the options available with Azure Container Apps.

### Backend ML Container App

1. Start by navigating to "Container Apps" and clicking "Create".

2. Now set your new container app name to be "ml-backend" and associate it with the environment you created earlier.

3. Next disable the QuickStart image and select the ACR you created earlier with the associated backend image. You can be flexible with the memory and CPU you would like to allocate to this container. In this example I only allocate 0.5 Cores and 1GB memory. 

4. Next we need to enable ingress. As mentioned due to the way our frontend calls the backend API we will need to enable access from "Anywhere" however if we were to change this call we could alternatively limit the backend ingress to within our managed environment. 

We also need to set our target port on our backend to port 5000.

5. Finally we should see our creation validated and we can click create.

6. Once creation is finished navigate to the new resource and view the URL. Copy this as we will need this for our front end creation. 

We can check our container is running correctly by clicking the url and viewing the message displayed. We can also then navigate to the /docs and view the available API's. 

### Frontend ML Container App

1. To create our front end we will follow similar steps to before. We will start by creating a new container app in the same environment we used earlier. 

2. We will then select our frontend image and select the same resource limits as before however this time we also need to add an environment variable. We can do this at the bottom of the config options. The environment variable we need to add is:

REACT_APP_API_ENDPOINT <BACKEND URL>/net/image/prediction/

3. We will enable ingress from anywhere to make our frontend public and set the target port as 3000. 

4. We can then let Azure validate the resource and click create one validated. 

Once this is created we can click on the frontend URL and will be taken to our frontend application. 

From this point we can pass through any image url into the field to be processed. 

The below url is of a burger, try to pass it into the url field. 

https://img.grouponcdn.com/deal/k3EyCBD149fq3nSARny/ft-2048x1229/v1/c700x420.jpg

I have also uploaded some other images into a public storage account. Feel free to try them too.

Garlic Bread 1 - https://publicdemoresourcesoow.blob.core.windows.net/food-images/garlicbread1.jpg

Garlic Bread 2 - https://publicdemoresourcesoow.blob.core.windows.net/food-images/garlicbread2.jpg

Ice Cream - https://publicdemoresourcesoow.blob.core.windows.net/food-images/IceCream.jpg

Lasagna - https://publicdemoresourcesoow.blob.core.windows.net/food-images/lasgna.jpg

Feel free to upload your own images to try or use images from Google. Some images on google may not allow you to process them and may cause an error. 

## Wrap Up

This has served to show how easy Azure Container Apps makes it to deploy containerised versions of your ML Models ready to be consumed. This example could be improved by adding APIM in front of this ML backend to benefit from rate limiting and other enterprise standard API features.

We could also evaluate the autoscaling of this solution and use Azure Load Testing to ensure our container apps environment is able to scale to meet our expected demand.

## Follow on steps

MLOPS can often be a challenge when we think about ML deployments on cloud native platforms. ACA has some features out of the box that can be leveraged to assist from an MLOPS perspective:

- Revisions - Revisions allow users to deploy multiple versions of an application into your container apps environment with build in traffic splitting. This is perfect for trailing new models in development or production environments. 

- Azure Container Registry - Because of ACA's ease of integration with Azure container registry existing ML pipelines deploying and updating new images can use ACR tasks to regularly update container images in ACR as models are improved. 

That being said ACA is not a native ML platform and requires consideration and most likely a bespoke solution to enable monitoring of the accuracy and performance of the ML Model itself.

