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

	const MY_QUERY = gql`
		query MyQuery($startId: ID, $pageSize: Int!) {
			users(startId: $startId, pageSize: $pageSize) {
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

	let scrollContainer: HTMLElement;

	let loadMoreTimeout;

	function loadMore() {
		console.log('In loadMore');

		// if (isLoading) return;

		// isLoading = true;
		console.log(`Is loading 1: ${isLoading}`);
		startId = users[users.length - 1] ? Number(users[users.length - 1].id) + 1 : startId;
		console.log(`Loading more users starting from id: ${startId}`);

		client
			.query(MY_QUERY, { startId, pageSize })
			.toPromise()
			.then((response) => {
				if (response.error) {
					console.error(response.error);
				} else if (response.data && response.data.users) {
					users = [...users, ...response.data.users];
					console.log('users: ', users);
				} else {
					console.error('Unexpected response format:', response);
				}
				isLoading = false;
				console.log(`Is loading 2: ${isLoading}`);
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
