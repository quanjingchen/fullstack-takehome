<script lang="ts">
	import { cacheExchange, createClient, fetchExchange, gql, queryStore } from '@urql/svelte';
	import Loader from 'components/Loader.svelte';
	import User from 'components/User.svelte';
	import type { UserType } from 'lib/types';
	import { onMount } from 'svelte';

	const client = createClient({
		url: 'http://localhost:5173/graphql',
		exchanges: [cacheExchange, fetchExchange]
	});

	const getUsers = gql`
		query ($startId: ID, $pageSize: Int!) {
			usersPage(startId: $startId, pageSize: $pageSize) {
				users {
					id
					name
					avatar
					email
				}
				hasMore
				startId
			}
		}
	`;

	const searchUsers = gql`
		query ($query: String!) {
			searchUsers(query: $query) {
				id
				name
				avatar
				email
			}
		}
	`;

	let startId = 1;
	const pageSize = 10;
	let isLoading = false;
	let users: UserType[] = [];
	let hasMore = true; // Assume there are more users to load initially
	let scrollContainer: HTMLElement;
	let loadMoreTimeout: NodeJS.Timeout;
	let isMounted = false;
	let triggerReloadAfterSearch = false;

 // for client.query method check out https://formidable.com/open-source/urql/docs/basics/core/
	let searchTerm = '';
	$: if (searchTerm) {
		triggerReloadAfterSearch = true;
		isLoading = true;
		client
			.query(searchUsers, { query: searchTerm })
			.toPromise()
			.then((result) => {
				users = result.data.searchUsers;
				isLoading = false;
			})
			.catch((error) => {
				console.error(error);
				isLoading = false;
			});
	} else {
		if (isMounted && triggerReloadAfterSearch) {
			users = [];
			startId = 1;
			loadMore();
			triggerReloadAfterSearch = false;
		}
	}

	function loadMore() {
		console.log(`Loading more users starting from id: ${startId}`);
		client
			.query(getUsers, { startId, pageSize })
			.toPromise()
			.then((result) => {
				users = [...users, ...result.data.usersPage.users];
				hasMore = result.data.usersPage.hasMore;
				startId = result.data.usersPage.startId;
				console.log('result.data.usersPage: ', result.data.usersPage);
				// If the initial item list doesn't fill the viewport (no scrollbar), just continue loading items until scrolling is enabled.
				setTimeout(() => {
					if (scrollContainer.scrollHeight <= scrollContainer.clientHeight && hasMore) {
						console.log(`initial item list doesn't fill the viewport`);
						loadMore();
					}
				}, 0); //Use setTimeout with 0 delay to ensure DOM updates finish before loading more items.

				isLoading = false;
			})
			.catch((error) => {
				console.error(error);
				isLoading = false;
			});
	}

	function handleScroll() {
		const scrollPosition = scrollContainer.scrollTop + scrollContainer.clientHeight;
		const scrollHeight = scrollContainer.scrollHeight;
		const scrollThreshold = 100;
		// If near the bottom of the scroll container, start loading more items
		if (scrollPosition >= scrollHeight - scrollThreshold) {
			// Clear the previous timeout if it exists. This can prevent multiple rapid triggers of loadMore
			if (loadMoreTimeout) {
				clearTimeout(loadMoreTimeout);
			}
			// If there are no more users to load or if it's in search mode, stop the execution of the function
			if (!hasMore || searchTerm) {
				isLoading = false;
				return;
			}
			isLoading = true; // Set isLoading to true immediately
			// Set a timeout to delay the loadMore call. It is used to visualize the loading spinner, as data fetch is too fast locally
			loadMoreTimeout = setTimeout(() => {
				loadMore();
			}, 500); // 500ms delay
		}
	}

	onMount(() => {
		// Initial load
		isMounted = true;
		loadMore();
		scrollContainer.addEventListener('scroll', handleScroll);
		return () => {
			scrollContainer.removeEventListener('scroll', handleScroll);
		};
	});

</script>

<div class="w-full h-full overflow-scroll" bind:this={scrollContainer}>
	<div class="flex flex-col gap-4 items-center p-4">
		<input type="text" bind:value={searchTerm} placeholder="Search users" />
		{#each users as user (user.id)}
			<User {user} />
		{/each}
		{#if isLoading}
			<Loader />
		{/if}
	</div>
</div>
