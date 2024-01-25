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

export type Node = FileNode | DirNode;

export type NodesById = Record<string, Node>;

export type AppData = Record<string, NodesById>;
