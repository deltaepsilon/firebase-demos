# 1-Endpoints

### Upload your data

- Navigate your browser to your Firebase App Dashboard as described in the blog post.
- Edit the url in your browser to make it ```https://your-firebase.firebaseio.com/endpoints```. Basically, you're adding ```/endpoints``` to your base url. Load the new URL.
- Import ```1-endpoints/data.json``` to ```https://your-firebase.firebaseio.com/endpoints``` by clicking the "Import Data" button at the top right of your App Dashboard and following the prompts.
- If you have more questions, read this short blog post for instructions to import data to Firebase: [Switching to Firebase](https://www.firebase.com/blog/2014-08-12-switching-to-firebase.html).

### Configure index.html

- Find line 55 of ```index.html```.
- Edit ```var usersRoot = "https://demos-firebase.firebaseio.com/endpoints/users/"``` to reference your Firebase by changing ```https://demos-firebase.firebaseio.com``` to your Firebase data URL.
