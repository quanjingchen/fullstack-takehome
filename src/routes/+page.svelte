<script lang="ts">
	import { cacheExchange, createClient, fetchExchange, gql, queryStore } from '@urql/svelte';
	import Loader from 'components/Loader.svelte';
	import User from 'components/User.svelte';
	import type { UserType, UsersPageType } from 'lib/types';
	import { onMount, afterUpdate } from 'svelte';

	const client = createClient({
		url: 'http://localhost:5173/graphql',
		exchanges: [cacheExchange, fetchExchange]
	});

	const getUsers = gql`
		query ($from: Int!, $limit: Int!) {
			usersPage(from: $from, limit: $limit) {
				users {
					id
					name
					avatar
					email
				}
				hasMore
			}
		}
	`;

	let from = 0;
	let limit = 10;
	let users: UserType[] = [];
	let hasMore = true; // Assume there are more users to load initially
	let scrollContainer: HTMLElement;
	let nextPageTimeout: NodeJS.Timeout;

	$: getUserStore = queryStore<{ usersPage: UsersPageType }>({
		client,
		query: getUsers,
		variables: { from, limit }
	});

	$: {
		const userStoreData = $getUserStore.data;
		if (userStoreData) {
			console.log(userStoreData.usersPage.users);
			users = [...users, ...userStoreData.usersPage.users];
			hasMore = userStoreData.usersPage.hasMore;
		}
	}
	function nextPage() {
		// If there are no more users to load, stop the execution of the function
		if (!hasMore) {
			return;
		}
		from = from + limit;
		console.log(`Loading more users starting from id: ${from}`);
	}

	function checkScroll() {
		// If the fetch doesn't fill the viewport, it continues fetching until scrolling is enabled.
		if (scrollContainer.scrollHeight <= scrollContainer.clientHeight && hasMore) {
			nextPage();
		}
	}

	function handleScroll() {
		const scrollPosition = scrollContainer.scrollTop + scrollContainer.clientHeight;
		const scrollHeight = scrollContainer.scrollHeight;
		const scrollThreshold = 100;
		// If near the bottom of the scroll container, start loading more items
		if (scrollPosition >= scrollHeight - scrollThreshold) {
			// Clear the previous timeout if it exists. This can prevent multiple rapid triggers of nextPage
			if (nextPageTimeout) {
				clearTimeout(nextPageTimeout);
			}
			// If there are no more users to load or if it's in search mode, stop the execution of the function
			if (!hasMore) {
				return;
			}
			// Set a timeout to delay the nextPage call to prevent excessive queries
			nextPageTimeout = setTimeout(() => {
				nextPage();
			}, 500); // 500ms delay
		}
	}

	afterUpdate(() => {
		// Call the `checkScroll` function after each update. This ensures that the list of users always fills the entire viewport.
		checkScroll();
	});

	onMount(() => {
		scrollContainer.addEventListener('scroll', handleScroll);
		return () => {
			scrollContainer.removeEventListener('scroll', handleScroll);
		};
	});
</script>

<div class="w-full h-full overflow-scroll" bind:this={scrollContainer}>
	<div class="flex flex-col gap-4 items-center p-4">
		{#each users as user (user.id)}
			<User {user} />
		{/each}
		{#if $getUserStore.fetching}
			<Loader />
		{/if}
	</div>
	<button on:click={nextPage}>Next page<button /></button>
</div>
