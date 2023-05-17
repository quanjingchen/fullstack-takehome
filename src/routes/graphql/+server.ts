import { createYoga, createSchema } from 'graphql-yoga';
import { useGraphQlJit } from '@envelop/graphql-jit';

import type { RequestEvent } from '@sveltejs/kit';

import { users } from '$lib/data';

import schema from '$lib/schema.gql';

const yogaApp = createYoga<RequestEvent>({
	schema: createSchema({
		typeDefs: schema,
		resolvers: {
			Query: {
				// users: (source, args, context, info) => users
				usersPage: (source, { startId, pageSize }) => {
					// Find the index of the startId in the users array
					const startIndex = users.findIndex(user => user.id === Number(startId));
					console.log('startIndex: ', startIndex)
					const endIndex = startIndex + pageSize;
					// Get the slice of users to return
					const usersSlice = users.slice(startIndex, endIndex);
					// Determine if there are more users available
					const hasMore = endIndex < users.length;
					// Return the users, hasMore and startId field
					return {
						users: usersSlice,
						hasMore,
						startId: hasMore ? users[endIndex].id : null
					};
				},
				searchUsers: (source, { query }) => {
					// Make the search case-insensitive
					return users.filter(user => user.name.toLowerCase().includes(query.toLowerCase()));
				}
			}
		}
	}),
	plugins: [useGraphQlJit()],
	fetchAPI: globalThis
});

export { yogaApp as GET, yogaApp as POST };
