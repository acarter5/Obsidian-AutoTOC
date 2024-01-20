export type Node = {
	id: string;
	isDir: boolean;
	name: string;
	items?: { id: string }[];
	link?: string;
};

export type AppData = Record<string, Record<string, Node>>;
