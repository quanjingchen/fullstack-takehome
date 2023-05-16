# The Linguistic Full Stack Challenge

This application implements a lazy-loaded list of users via Svelte and GraphQL, focusing on efficiency and user experience.

## Design Decisions

1. **Initial User Batch**: We fetch only 10 users initially to keep the application responsive and to conserve bandwidth. The batch size is easily adjustable to meet future needs.

2. **Scroll Detection & Loading Spinner**: We monitor the scroll position and trigger a loading spinner when the user reaches the bottom of the list. This immediate feedback enhances user experience.

3. **Fetching Additional Users**: When the loading spinner is active, we fetch the next batch of users and append them to the list. This operation respects the original batch size, providing a consistent experience.

4. **End of Data Handling**: When all users have been loaded, we stop network requests and hide the loading spinner. This is achieved using a 'hasMore' flag from the server, ensuring the application behaves gracefully even when no more data is available.

