Reading Data

Upload your data

- If necessary, import 3-reading-data/data.json to https://your-firebase.firebaseio.com/twitterClone.

Build the demo

- Open 6-querying-data/index.html.
- Find the script.js file. This is all we'll be editing.
- Note that the comments in file will provide a detailed walkthrough of the code that you'll be writing.
- Complete the steps as outlined in the comments.


Takeaways

- Use .orderByChild() to order by a child node.
- Listen to "child_added" events to receive tweets as ordered by child. Simply listening to "value" does not result in an ordered list. You've got to use "child_added".
- Use .orderByKey() and .limitToLast() to query the end of a Firebase "array".
- Listen to the "child_removed" events and fan out deletions.