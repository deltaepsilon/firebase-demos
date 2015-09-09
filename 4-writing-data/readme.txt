Reading Data

Upload your data

- If necessary, import 3-reading-data/data.json to https://your-firebase.firebaseio.com/twitterClone.

Build the demo

- Open 4-writing-data/index.html.
- Find the last <script> block in the file. This is all we'll be editing.
- Note that the comments in file will provide a detailed walkthrough of the code that you'll be writing.
- Complete the steps as outlined in the comments.


Takeaways

- Use .push to add to a node
- Use .transaction to increment a value node
- Use .on('child_added', []) to fan out new children
- Use dataSnapshot.forEach() to loop through children of a node
- Use .remove() to remove a ref