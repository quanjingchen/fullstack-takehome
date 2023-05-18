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
				usersPage: (source, { from, limit }) => {
					const endIndex = from + limit;
					console.log('[SERVER] startIndex: ', from)
					// Get the slice of users to return
					const usersSlice = users.slice(from, endIndex);
					// Determine if there are more users available
					const hasMore = endIndex < users.length;
					// Return the users, hasMore fields
					return {
						users: usersSlice,
						hasMore
					};
				},
				searchUsers: (source, { searchTerm }) => {
					// Make the search case-insensitive
					console.log('[SERVER] search: ',  searchTerm)
					return users.filter(user => user.name.toLowerCase().includes(searchTerm.toLowerCase()));
				}
			}
		}
	}),
	plugins: [useGraphQlJit()],
	fetchAPI: globalThis
});

export { yogaApp as GET, yogaApp as POST };
