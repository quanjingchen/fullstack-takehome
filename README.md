# The Linguistic Full Stack Challenge

This application implements a lazy-loaded list of users via Svelte and GraphQL, focusing on efficiency and user experience.

## Design Decisions

1. **Initial User Batch:** Initially, the application fetches only 10 users (as defined by the `limit` constant) to ensure responsiveness and optimize load times. If the viewport is not filled (no scrollbar), additional users are fetched in batches of 10 (controlled by the nextPage function) until a scrollbar appears. This is achieved by the `checkScroll` function which is called whenever new users are fetched.

2. **GraphQL Query Execution:** The `queryStore` from `@urql/svelte` is used for making GraphQL queries. It returns a store that contains the state of the query, which can be used in a Svelte component to reactively display the query's results. In the earlier version, I used one-off queries with `client.query`, which is simple and effective, especially if you're accustomed to JavaScript promises. However, it doesn't utilize Svelte's reactive capabilities.

3. **Scroll Monitoring & Additional User Fetching:** The application monitors the scroll position and triggers the next batch of users to load when the user reaches near the bottom of the list. This mechanism is managed by the `handleScroll` function, which is debounced with a 500ms delay to optimize the scroll experience and minimize unnecessary fetching operations.

4. **End of Data Handling:** A `hasMore` flag controls whether there are more users to fetch. If there aren't, network requests stop, the loading spinner is removed, and a message is displayed indicating the end of available users, ensuring a graceful user experience.

5. **Debounced Search:** The application incorporates a debounce mechanism for search operations. The search function is debounced with a 500ms delay to optimize the search experience and minimize unnecessary operations. Reactive statements check for changes in the search term and either fetch users or search for users accordingly.

6. **Server-side Implementation:** There are two main queries in the schema:
    - `usersPage`: This query is used to fetch a batch of users. It accepts two arguments, `from` and `limit`, to control the range of users fetched. The query returns a list of users and a flag `hasMore` to indicate if more users are available.
    - `searchUsers`: This query takes a `searchTerm` argument and returns all users whose name matches the searchTerm in a case-insensitive manner.
