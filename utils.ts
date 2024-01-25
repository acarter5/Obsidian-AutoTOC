import type { Node, FileNode, DirNode } from "./types";
import { NodeType } from "./types";
import type { TAbstractFile } from "obsidian";

export function isDirNode(node: FileNode | DirNode): node is DirNode {
	return node.type === NodeType.DIR;
}

export const deleteFromNodes = (
	path: string,
	nodes: Record<string, FileNode | DirNode>,
	origin: string
): Record<string, FileNode | DirNode> => {
	const pathParts = path.split("/");
	pathParts.pop();
	const parentId = pathParts.join("/");

	delete nodes[path];

	// any ancestor node is by definition a DirNode
	const parentNode = nodes[parentId] as DirNode;

	const parentItems = parentNode.items;

	// get items idx of deleted file/dir reference in parent node
	const idxInParentItems = parentItems.findIndex(
		(childNodeRef) => childNodeRef.id === path
	);
	// remove deleted file/dir reference from parent items
	if (idxInParentItems >= 0) {
		parentNode.items = [
			...parentItems.slice(0, idxInParentItems),
			...parentItems.slice(idxInParentItems + 1),
		];
	}

	// If the parent node still has children, return
	if (parentNode.items.length) {
		return nodes;
	} else {
		const newPath = parentId;
		// if the Parent node is the root directory node, return
		if (newPath === origin) {
			return nodes;
		} else {
			// delete the parent node b/c it no longer has children and is not the root direcory node
			return deleteFromNodes(newPath, nodes, origin);
		}
	}
};

export const updateNodes = (
	path: string,
	fileOrDir: Record<string, any>,
	nodes: Record<string, FileNode | DirNode>
) => {
	const pathParts = path.split("/");
	const name = pathParts.pop() as string;
	const pages = fileOrDir.rows;
	const isDir = !!pages;
	const parent = pathParts.join("/");

	// create ancestor directory nodes for given file or directory
	pathParts.reduce((acc: null | string, cur: string) => {
		const parentId = acc;
		const id = parentId ? acc + "/" + cur : cur;
		// some ancestor directory nodes will already have been created
		// because a node can share a parentNode with other nodes
		if (!nodes[id]) {
			nodes[id] = {
				id,
				expanded: true,
				name: cur,
				items: [],
				type: NodeType.DIR,
			};
			if (parentId) {
				// this will always be a DirNode because it will have been created
				// as one earlier in the loop
				const parentNode = nodes[parentId] as DirNode;
				parentNode.items.push({ id });
			}
		}

		return id;
	}, null);

	const thisNode: FileNode | DirNode = isDir
		? {
				id: path,
				name,
				type: NodeType.DIR,
				expanded: true,
				items: pages.values.map((page: { file: TAbstractFile }) => ({
					id: page.file.path,
				})),
				// eslint-disable-next-line no-mixed-spaces-and-tabs
		  }
		: {
				id: path,
				name,
				type: NodeType.FILE,
				link: path,
				// eslint-disable-next-line no-mixed-spaces-and-tabs
		  };

	// Add thisNode to nodes
	if (!nodes[thisNode.id]) {
		const parentNode = nodes[parent] as DirNode;
		// Add thisNode to parent-node items array
		// list files before directories by default
		if (!isDirNode(thisNode)) {
			const { items } = parentNode;
			const firstDirIdx = items
				.map(({ id }) => nodes[id])
				.findIndex((node) => isDirNode(node));
			if (firstDirIdx >= 0) {
				parentNode.items = [
					...items.slice(0, firstDirIdx),
					{
						id: thisNode.id,
					},
					...items.slice(firstDirIdx),
				];
			} else {
				parentNode.items.push({
					id: thisNode.id,
				});
			}
		} else {
			parentNode.items.push({
				id: thisNode.id,
			});
		}
		nodes[thisNode.id] = thisNode;
		// A DirectoryNode may have already been created when creating ancestor nodes
		// in that case, we need to populate the node items
	} else {
		const existingNode = nodes[thisNode.id];
		if (isDirNode(existingNode) && isDirNode(thisNode)) {
			existingNode.items.unshift(...thisNode.items);
		}
	}

	// If thisNode is a DirNode, create nodes for all the pages in the directory
	if (isDirNode(thisNode)) {
		const pageNodes: FileNode[] = pages.values.map(
			(page: Record<string, any>) => ({
				id: page.file.path,
				link: page.file.path,
				name: page.file.name,
				type: NodeType.FILE,
			})
		);
		pageNodes.forEach((pageNode) => {
			nodes[pageNode.id] = pageNode;
		});
	}

	return nodes;
};

export const handleRename = (
	oldPath: string,
	newPath: string,
	nodes: Record<string, FileNode | DirNode>,
	skipUpdateParent = false
) => {
	let newNodes = nodes;
	const pathParts = oldPath.split("/");
	pathParts.pop();
	const newName = newPath.split("/").pop()?.split(".")[0];
	const parentId = pathParts.join("/");

	const existingNode = newNodes[oldPath];
	// delete node with old name
	delete newNodes[oldPath];

	const newItems: Node["items"] = [];

	// recursively update all descendant nodes to use new name
	if (isDirNode(existingNode)) {
		existingNode.items.forEach((item) => {
			const { id: oldItemPath } = item;
			const oldItemNode = newNodes[oldItemPath];
			const itemName = oldItemPath.split("/").pop();
			const newItemPath = [newPath, itemName].join("/");
			if (isDirNode(oldItemNode)) {
				const [updatedNodes] = handleRename(
					oldItemPath,
					newItemPath,
					{ ...newNodes },
					// skip updating the parent node b/c we've just done that
					true
				);
				newNodes = updatedNodes;
			} else {
				delete newNodes[oldItemPath];
				newNodes[newItemPath] = {
					id: newItemPath,
					name: itemName as string,
					link: newItemPath,
					type: NodeType.FILE,
				};
			}
			newItems.push({ id: newItemPath });
		});
	}

	// add node with new name to nodes
	const newNode = isDirNode(existingNode)
		? {
				...existingNode,
				id: newPath,
				name: newName as string,
				items: newItems,
				// eslint-disable-next-line no-mixed-spaces-and-tabs
		  }
		: {
				...existingNode,
				id: newPath,
				name: newName as string,
				link: newPath,
				// eslint-disable-next-line no-mixed-spaces-and-tabs
		  };

	newNodes[newPath] = newNode;

	// update parent items to reference new node
	const parent = newNodes[parentId] as DirNode;
	if (!skipUpdateParent && parent) {
		const parentItems = parent.items;

		const idxInParentItems = parentItems.findIndex(
			(ref) => ref.id === oldPath
		);

		newNodes[parentId] = {
			...parent,
			items: [
				...parentItems.slice(0, idxInParentItems),
				{ id: newPath },
				...parentItems.slice(idxInParentItems + 1),
			],
		};
	}

	return [newNodes, newNode] as const;
};
