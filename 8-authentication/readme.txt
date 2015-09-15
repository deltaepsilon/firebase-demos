Authentication

Configure

- If necessary, import 3-reading-data/data.json to https://your-firebase.firebaseio.com/twitterClone.
- Visit your Firebase App Dashboard and navigate to the Login & Auth page via the left nav. 
- Check the checkbox for "Enable Email & Password Authentication".


Takeaways

- Use ref.createUser and ref.authWithPassword to create authenticated users and log them in.
- Use ref.unauth to break authentication.
- Use an Access Control List to handle user privileges.
- Use ref.onAuth to listen and respond to changes in auth state. ref.onAuth gets called every time the page loads and every time the user subsequently logs in or out.