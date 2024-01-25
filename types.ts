export type Node = {
	id: string;
	isDir: boolean;
	name: string;
	items?: { id: string }[];
	link?: string;
	expanded?: boolean;
};

export enum NodeType {
	FILE = "file",
	DIR = "dir",
}

export type FileNode = {
	id: string;
	name: string;
	link: string;
	type: NodeType.FILE;
};

export type DirNode = {
	id: string;
	name: string;
	items: { id: string }[];
	expanded: boolean;
	type: NodeType.DIR;
};

export type AppData = Record<string, Record<string, FileNode | DirNode>>;
