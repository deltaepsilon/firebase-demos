# Endpoints

### Upload your data

- Navigate your browser to your Firebase App Dashboard as described in the blog post.
- Edit the url in your browser to make it ```https://your-firebase.firebaseio.com/endpoints```. Basically, you're adding ```/endpoints``` to your base url. Load the new URL.
- Import ```1-endpoints/data.json``` to ```https://your-firebase.firebaseio.com/endpoints``` by clicking the "Import Data" button at the top right of your App Dashboard and following the prompts.
- If you have more questions, read this short blog post for instructions to import data to Firebase: [Switching to Firebase](https://www.firebase.com/blog/2014-08-12-switching-to-firebase.html).

### Download your data

- Note the "Export Data" button at the top-right of the App Dashboard.
- The Export Data feature allows you to download JSON from whichever node you're viewing with the App Dashboard.

### Visit URls

- Open ```https://your-firebase.firebaseio.com/endpoints``` in your Browser, then click on the ```users``` node of the App Dashboard.
- Note that you can dig down into the data using the App Dashboard.
- Note that the App Dashboard includes breadcrumb links to traverse back up the data tree.
- Add ```.json``` to the end of your App Dashboard URL like so: ```https://your-firebase.firebaseio.com/endpoints/users.json``` to view JSON. 
- If using Google's Chrome brwoser, consider using the [JSONView](https://chrome.google.com/webstore/detail/jsonview/chklaanhfefbnpoihckbnefhakgolnmc) extension to automatically pretty print your JSON results.
- Navigate into individual user records and down into user tweets. Note that adding ```.json``` to any endpoint will return regular JSON instead of the App Dashboard view.

### Takeaways

- Execute data imports and exports directly from the App Dashboard.
- Firebase data structures are arbitrary. You can create almost any data structure that you like with a maximum of 32 nested nodes.