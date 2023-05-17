export type UserType = {
	id: string;
	name: string;
	email: string;
	avatar: string;
};

export type UsersPageType = {
  users: [UserType];
  hasMore: boolean;
	startId: number;
}