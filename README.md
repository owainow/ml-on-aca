# Deploy a Machine Learning model on Azure Container Apps
A demo/workshop created to assist in deploying containerised ML workloads onto Azure Container Apps.

This walkthrough is accompanied by a blog post which can be found here: 

https://techcommunity.microsoft.com/t5/apps-on-azure-blog/deploy-tensorflow-machine-learning-models-on-azure-container/ba-p/3981763


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

If you would like to read more about Azure Container Apps before starting please see the links below:

* Container Apps Overview - https://learn.microsoft.com/en-us/azure/container-apps/overview
* Container Apps Docs - https://learn.microsoft.com/en-us/azure/container-apps/?source=recommendations
* Compare Container Apps vs Other Container Services - https://learn.microsoft.com/en-us/azure/container-apps/compare-options

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

We then need to create our Container Apps environment. We will be using the consumption tier for this demo. To create our container apps environment we can run the following commands:

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

2. Now set your new container app name to be "ml-backend" and associate it with the environment you created earlier. <br />

<img width="596" alt="1 - Create container app" src="https://github.com/owainow/ml-on-aca/assets/48108258/28ce43f3-5040-47d2-b276-f48919da7eea"> <br />


3. Next disable the QuickStart image and select the ACR you created earlier with the associated backend image. You can be flexible with the memory and CPU you would like to allocate to this container. In this example I only allocate 0.5 Cores and 1GB memory. <br />

<img width="721" alt="2 - Container setup" src="https://github.com/owainow/ml-on-aca/assets/48108258/253010f2-25e5-41df-8ae2-d66d5240f1bc"> <br />


4. Next we need to enable ingress. As mentioned due to the way our frontend calls the backend API we will need to enable access from "Anywhere" however if we were to change this call we could alternatively limit the backend ingress to within our managed environment. 

We also need to set our target port on our backend to port 5000. <br />

<img width="683" alt="3 - ingress" src="https://github.com/owainow/ml-on-aca/assets/48108258/cbd64d75-e03d-475e-a09f-fa548499a8d5"> <br />

5. Finally we should see our creation validated and we can click create. <br />

<img width="533" alt="4 - Validation" src="https://github.com/owainow/ml-on-aca/assets/48108258/9d66e7ad-a38f-49aa-80dc-46d2e2602f6a"> <br />


6. Once creation is finished navigate to the new resource and view the URL. Copy this as we will need this for our front end creation. 

![5 - url](https://github.com/owainow/ml-on-aca/assets/48108258/b9550be8-aa97-401a-80c6-ae0c54a049ff)

We can check our container is running correctly by clicking the url and viewing the message displayed. We can also then navigate to the /docs and view the available API's. <br />

<img width="475" alt="food-api-running" src="https://github.com/owainow/ml-on-aca/assets/48108258/55498145-5353-40fb-8e1e-1ffba5a6f235"> <br />

### Frontend ML Container App

1. To create our front end we will follow similar steps to before. We will start by creating a new container app in the same environment we used earlier. <br />

<img width="930" alt="5 - ml frontend" src="https://github.com/owainow/ml-on-aca/assets/48108258/2ca044ea-f91d-4c3b-95f9-e1720223e11f"> <br />

2. We will then select our frontend image and select the same resource limits as before however this time we also need to add an environment variable. We can do this at the bottom of the config options. The environment variable we need to add is:

REACT_APP_API_ENDPOINT | "BACKEND URL/net/image/prediction/" <br />

<img width="662" alt="6 - frontend container" src="https://github.com/owainow/ml-on-aca/assets/48108258/aa824cba-af1f-4adc-aaf9-d46219a10caf"> <br />

3. We will enable ingress from anywhere to make our frontend public and set the target port as 3000. <br />

<img width="646" alt="7 - frontend ingress" src="https://github.com/owainow/ml-on-aca/assets/48108258/23affe3f-ee2b-4989-935d-6e9d803254df"> <br />

4. We can then let Azure validate the resource and click create one validated. 

Once this is created we can click on the frontend URL and will be taken to our frontend application. 

From this point we can pass through any image url into the field to be processed. <br />

<img width="1200" alt="Frontend" src="https://github.com/owainow/ml-on-aca/assets/48108258/79951ece-6414-41f6-b680-65fa37779536"> <br />

Once the image url is submitted you will see the processing message. After that you will be redirected to the result of the API call on the backend container. <br />

<img width="449" alt="image" src="https://github.com/owainow/ml-on-aca/assets/48108258/7f3ade47-4bde-4024-94d8-c0bb7d2c41c0"> <br />

I have uploaded some images into a public storage account. Feel free to try them once your application is up and running.

Garlic Bread 1 - https://publicdemoresourcesoow.blob.core.windows.net/food-images/garlicbread1.jpg

Garlic Bread 2 - https://publicdemoresourcesoow.blob.core.windows.net/food-images/garlicbread2.jpg

Ice Cream - https://publicdemoresourcesoow.blob.core.windows.net/food-images/IceCream.jpg

Lasagna - https://publicdemoresourcesoow.blob.core.windows.net/food-images/lasgna.jpg

Feel free to upload your own images to try or use images from Google. Some images on google may not allow you to process them and may cause an error. 

## Wrap Up

This has served to show how easy Azure Container Apps makes it to deploy containerised versions of your ML Models ready to be consumed. This example could be improved by adding APIM in front of this ML backend to benefit from rate limiting and other enterprise standard API features.

We could also evaluate the autoscaling of this solution and use Azure Load Testing to ensure our container apps environment is able to scale to meet our expected demand.

The model, backend and front end files are all available in this repository. Feel free to fork this repository and improve the application or adjust it for your own demos.

## Follow on steps

MLOPS can often be a challenge when we think about ML deployments on cloud native platforms. ACA has some features out of the box that can be leveraged to assist from an MLOPS perspective:

- Revisions - Revisions allow users to deploy multiple versions of an application into your container apps environment with build in traffic splitting. This is perfect for trailing new models in development or production environments. 

- Azure Container Registry - Because of ACA's ease of integration with Azure container registry existing ML pipelines deploying and updating new images can use ACR tasks to regularly update container images in ACR as models are improved.

We could also look to make the most of Azure Container Apps DAPR integration out of the box to make our service to service calls simple using DAPR sidecars.

That being said ACA is not a native ML platform and requires consideration and most likely a bespoke solution to enable monitoring of the accuracy and performance of the ML Model itself.

