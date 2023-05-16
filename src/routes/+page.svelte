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
		query($startId: ID, $pageSize: Int!) {
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

	let startId = 1;
	const pageSize = 10;
	let isLoading = false;
	let users: UserType[] = [];
	let hasMore = true; // Assume there are more users to load initially
	let scrollContainer: HTMLElement;
	let loadMoreTimeout: NodeJS.Timeout;

	function loadMore() {
		console.log(`Loading more users starting from id: ${startId}`);
		client
			.query(getUsers, { startId, pageSize })
			.toPromise()
			.then((response) => {
				if (response.error) {
					console.error(response.error);
				} else if (response.data && response.data.usersPage) {
					users = [...users, ...response.data.usersPage.users];
					hasMore = response.data.usersPage.hasMore;
					startId = response.data.usersPage.startId;
					console.log('response.data.usersPage: ', response.data.usersPage);
				} else {
					console.error('Unexpected response format:', response);
				}
				isLoading = false;
			})
			.catch((error) => {
				console.error(error);
				isLoading = false;
			});
	}

	onMount(() => {
		function handleScroll() {
			const scrollPosition = scrollContainer.scrollTop + scrollContainer.clientHeight;
			const scrollHeight = scrollContainer.scrollHeight;
			const scrollThreshold = 100;
			if (scrollPosition >= scrollHeight - scrollThreshold) {
				// Clear the previous timeout if it exists
				if (loadMoreTimeout) {
					clearTimeout(loadMoreTimeout);
				}
				// If there are no more users to load, stop the execution of the function
				if (!hasMore) {
					isLoading = false
					return
				}
				isLoading = true; // Set isLoading to true immediately
				// Set a timeout to delay the loadMore call
				loadMoreTimeout = setTimeout(() => {
					loadMore();
				}, 500); // 500ms delay
			}
		}
		scrollContainer.addEventListener('scroll', handleScroll);
		return () => {
			scrollContainer.removeEventListener('scroll', handleScroll);
		};
	});
	// Initial load
	loadMore();
</script>

<div class="w-full h-full overflow-scroll" bind:this={scrollContainer}>
	<div class="flex flex-col gap-4 items-center p-4">
		{#each users as user (user.id)}
			<User {user} />
		{/each}
		{#if isLoading}
			<Loader />
		{/if}
	</div>
</div>
