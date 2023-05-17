<script lang="ts">
	import {
		cacheExchange,
		createClient,
		fetchExchange,
		gql,
		queryStore,
		type AnyVariables,
		type OperationResultStore,
		type Pausable
	} from '@urql/svelte';
	import Loader from 'components/Loader.svelte';
	import User from 'components/User.svelte';
	import type { UserType, UsersPageType } from 'lib/types';
	import { onMount } from 'svelte';

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

	let limit = 10;
	let from = 0;
	let users: UserType[] = [];
	let hasMore = true; // Assume there are more users to load initially
	let scrollContainer: HTMLElement;
	let nextPageTimeout: NodeJS.Timeout;
	let searchTerm = '';
	let getUserStore: OperationResultStore<{ usersPage: UsersPageType }, AnyVariables> & Pausable;
	let searchUsersStore: OperationResultStore<{ searchUsers: UserType[] }, AnyVariables> & Pausable;

	$: {
		// Reset the user list and the start index for fetching users when search term is cleared
		if (searchTerm == '') {
			console.log('[0] reset UserList');
			resetUserList();
		}
	}

	$: {
		if (!searchTerm) {
			console.log('[1] fetch user data');
			getUserStore = queryStore<{ usersPage: UsersPageType }>({
				client,
				query: getUsers,
				variables: { from, limit }
			});
			const userStoreData = $getUserStore.data;
			console.log('[1] $getUserStore.data: ', userStoreData);
			if (userStoreData) {
				users = [...users, ...userStoreData.usersPage.users];
				console.log('[1] push new users in to users: ', users.length);

				hasMore = userStoreData.usersPage.hasMore;
			}
		}
	}

	$: if (searchTerm) {
		console.log('[2] search user data');

		searchUsersStore = queryStore<{ searchUsers: UserType[] }>({
			client,
			query: searchUsers,
			variables: { query: searchTerm }
		});

		const searchStoreData = $searchUsersStore?.data;
		console.log('[2] $searchUsersStore?.data: ', $searchUsersStore?.data);

		if (searchStoreData) {
			users = searchStoreData.searchUsers;
			console.log('[2] update users array with search data: ', users);
			hasMore = false; // stop fetching more users during search
		}
	}



	function resetUserList() {
		from = 0;
		users = [];
		getUserStore = queryStore({
			client,
			query: getUsers,
			variables: { from, limit }
		});
	}

	function nextPage() {
		// If there are no more users to load, stop the execution of the function
		if (!hasMore) {
			return;
		}
		from = from + limit;
		console.log(`[4] Loading more users starting from id: ${from}`);
	}

	// function checkScroll() {
	// 	// If the fetch doesn't fill the viewport, it continues fetching until scrolling is enabled.
	// 	if (scrollContainer.scrollHeight <= scrollContainer.clientHeight && hasMore) {
	// 		nextPage();
	// 	}
	// }

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

	onMount(() => {
		scrollContainer.addEventListener('scroll', handleScroll);
		return () => {
			scrollContainer.removeEventListener('scroll', handleScroll);
		};
	});
</script>

<div class="w-full h-full overflow-scroll" bind:this={scrollContainer}>
	<div class="flex flex-col gap-4 items-center p-4">
		<input
			class="w-full px-3 py-2 mb-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600"
			type="text"
			bind:value={searchTerm}
			placeholder="Search users"
		/>
		{#each users as user (user.id)}
			<User {user} />
		{/each}
		{#if $getUserStore.fetching}
			<Loader />
		{/if}
	</div>

	{#if hasMore}
		<div class="w-full flex justify-center">
			<button
				class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
				on:click={nextPage}>Load More</button
			>
		</div>
	{/if}
</div>
