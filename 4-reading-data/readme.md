# Reading Data

### Upload your data

- Navigate your browser to ```https://your-firebase.firebaseio.com/twitterClone```.
- Import ```4-reading-data/data.json``` to ```https://your-firebase.firebaseio.com/twitterClone```.

### Dependencies

This demo will require a few dependencies to speed up our client-side development.

- [jQuery](https://jquery.com/): DOM toolbelt
- [Bootstrap](http://getbootstrap.com/): Default styling and some nice JS-driven elements
- [Underscore](http://underscorejs.org/): A JavaScript toolbelt used mostly for templating

### Build the demo

- Open ```4-reading-data/index.html```.
- Find the last ```<script>``` block in the file. This is all we'll be editing.
- Note that the comments in file will provide a detailed walkthrough of the code that you'll be writing.
- Complete the steps as outline in the comments.


### Takeaways

- Use the ```.child``` function to traverse child nodes.
- Use the ```.once``` function to listen to events on a ref.
- Listen to the ```value``` event to retrieve all of a ref's data as soon as it has arrived from your firebase.
- The ```value``` event's callback receives a [data snapshot](https://www.firebase.com/docs/web/api/datasnapshot/).
- Use the ```dataSnapshot.val``` function to retrieve the snapshot's data payload.