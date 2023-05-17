<script lang="ts">
	import { cacheExchange, createClient, fetchExchange, gql, queryStore } from '@urql/svelte';
	import Loader from 'components/Loader.svelte';
	import User from 'components/User.svelte';
	import type { UserType, UsersPageType } from 'lib/types';

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
	let limit = 50;
	let users: UserType[] = [];
	let hasMore = true; // Assume there are more users to load initially

	$: getUserStore = queryStore<{ usersPage: UsersPageType }>({
		client,
		query: getUsers,
		variables: { from, limit }
	});

	$: {
  const userStoreData = $getUserStore.data;
  if (userStoreData) {
		console.log(userStoreData.usersPage.users)
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

</script>
<div class="w-full h-full overflow-scroll">
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
