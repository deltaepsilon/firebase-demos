Indexing Data

Review Sample Index Rules

- Review 8-indexing-data/security-rules.json


Takeaways

- Firebase security rules are built using JSON.
- The security rules object follows the structure of the data that it's securing.
- Use "$"-prefixed names as wildcards to apply rules to groups of undetermined keys. This is especially useful for groups of push keys.
- Use the ".indexOn": ["someKey"] syntax to specify multiple indices.