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
				users: (source, { startId, pageSize }) => {
					const startIndex = startId - 1;
					const endIndex = startIndex + pageSize;
					// Get the slice of users to return
					const usersSlice = users.slice(startIndex, endIndex);
					// Determine if there are more users available
					const hasMore = endIndex < users.length;
					// Return the users and the hasMore field
					return {
						users: usersSlice,
						hasMore
					};

				}
			}
		}
	}),
	plugins: [useGraphQlJit()],
	fetchAPI: globalThis
});

export { yogaApp as GET, yogaApp as POST };
