# Flat Data

### Upload your data

- Navigate your browser to ```https://your-firebase.firebaseio.com/dataDesign```.
- Import ```1-data-design/data.json``` to ```https://your-firebase.firebaseio.com/dataDesign```.

### Deep Nesting (often a bad idea)

- Open ```https://your-firebase.firebaseio.com/dataDesign/deepNesting```.
- Explore an individual user within ```https://your-firebase.firebaseio.com/dataDesign/deepNesting/users```.
- Note that each ***user*** object contains a nested list of all sent tweets as well as a separate list of timeline tweets.
- This is bad news, because you cannot query ```https://your-firebase.firebaseio.com/dataDesign/deepNesting/users/some-user-key``` without returning the ***entire data structure***. The ```tweets``` and ```timeline``` trees are arbitrarily long, so as the data grows the user object could become extremely costly to query.

### Shallow Nesting (usually preferred)

- Open ```https://your-firebase.firebaseio.com/dataDesign/shallowNesting```.
- Expore the ```shallowNesting/userObjects``` node and open ```shallowNesting/userObjects/timeline``` and ```shallowNesting/userObjects/tweets```.
- Note that each "push key" under the ```timeline``` and ```tweets``` nodes corresponds to a user key under the ```shallowNesting/users``` node.
- This structure enables you to query the ```timeline``` and ```tweets``` data structures separately from ```users```. The ```users``` object is now shallow and will not grow out of control. The ```timeline``` and ```tweets``` objects will grow, but they can be queried separately using [limitToFirst](https://www.firebase.com/docs/web/api/query/limittofirst.html) and [limitToLast](https://www.firebase.com/docs/web/api/query/limittolast.html) queries as will be explained later.

### Duplicate Data

- Open ```https://your-firebase.firebaseio.com/dataDesign/duplicateData```.
- Expand an individual user record under ```duplicateData/userObjects/timeline``` and continue to expand until you reach ```duplicateData/userObjects/timeline/some-user-key/some-timeline-key```.
- Note that the timeline entry has ```created```, ```text``` and ```user``` child keys. 
- Expand the ```user``` child key to view the details of the user that posted a tweet to this timeline.
- Note that the ```user``` child key includes a ```key``` node that would—if this were a production app instead of fake data—correspond to the user key.
- This sort of data duplication can dramatically decrease the need to query data across users. The ```timeline``` data structure now contains all of the data that we would need to display the timeline in a web view.

### Takeaways

- Deep nesting is dangerous in Firebase, because one cannot query a parent node without returning ***all*** of the child nodes. If these child nodes are allowed to grow, they can produce very expensive, long-running queries.
- Breaking nested data out using shared keys can avoid overly large data structures at a cost of some added data complexity.
- Strategically duplicate data to reduce queries where possible.
- Structure your data to match the use case. 
- A "read-heavy" application such as our Twitter example calls for data to be "fanned out" into individual user timelines, resulting in more expensive writes but much cheaper reads.
- A "write-heavy" application—an example might be recording time series data from a scientific instrument—would call for incoming data logs that could then be transformed into more read-friendly data structures as needed.