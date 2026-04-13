export type Channel =
	| 'server_state'
	| 'playerlist'
	| 'console'
	| `report:general`
	| `report:${number}`;

export interface WSMessage<T = unknown> {
	channel: Channel;
	event: string;
	data: T;
}
