<script lang="ts">
	import { cacheExchange, createClient, fetchExchange, gql, queryStore } from '@urql/svelte';
	import Loader from 'components/Loader.svelte';
	import User from 'components/User.svelte';
	import type { UserType } from 'lib/types';

	const client = createClient({
		url: '/graphql',
		exchanges: [cacheExchange, fetchExchange]
	});

/*
	const result = queryStore<{ users: UserType[] }>({
		client,
		query: gql`
			query {
				users {
					id
					name
					avatar
					email
				}
			}
		`
	});
	*/

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

	const result = queryStore<{ users: UserType[] }>({
		client,
		query: MY_QUERY,
		variables: {
    	startId: '1',
    	pageSize: 10, // Replace with the desired page size
  	},
	});

</script>

<div class="w-full h-full overflow-scroll">
	<div class="flex flex-col gap-4 items-center p-4">
		{#if $result.fetching}
			<Loader />
		{:else if $result.data}
			{#each $result.data.users as user (user.id)}
				<User {user} />
			{/each}
		{/if}
	</div>
</div>
