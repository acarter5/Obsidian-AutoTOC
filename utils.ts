import type { Node } from "./types";
import type { TAbstractFile } from "obsidian";

export const deleteFromNodes = (
	path: string,
	nodes: Record<string, Node>,
	origin: string
): Record<string, Node> => {
	const pathParts = path.split("/");
	pathParts.pop();
	const parentId = pathParts.join("/");

	delete nodes[path];

	const parentItems = nodes[parentId].items;

	const idxInParentItems = parentItems.findIndex((ref) => ref.id === path);
	if (idxInParentItems >= 0) {
		nodes[parentId].items = [
			...parentItems.slice(0, idxInParentItems),
			...parentItems.slice(idxInParentItems + 1),
		];
	}

	if (nodes[parentId].items.length) {
		return nodes;
	} else {
		const newPath = parentId;
		if (newPath === origin) {
			return nodes;
		} else {
			return deleteFromNodes(newPath, nodes, origin);
		}
	}
};

export const updateNodes = (
	path: string,
	fileOrDir: Record<string, any>,
	nodes: Record<string, Node>
) => {
	const pathParts = path.split("/");
	const name = pathParts.pop() as string;
	const pages = fileOrDir.rows;
	const isDir = !!pages;
	const parent = pathParts.join("/");

	pathParts.reduce((acc: null | string, cur: string) => {
		const parentId = acc;
		const id = parentId ? acc + "/" + cur : cur;
		if (!nodes[id]) {
			nodes[id] = {
				id,
				isDir: true,
				expanded: true,
				name: cur,
				items: [],
			};
			if (parentId) {
				nodes[parentId].items.push({ id });
			}
		}

		return id;
	}, null);

	const thisNode = {
		id: path,
		name,
		isDir,
		link: isDir ? undefined : path,
		expanded: true,
		items: isDir
			? pages.values.map((page: { file: TAbstractFile }) => ({
					id: page.file.path,
			  }))
			: undefined,
	};

	if (!nodes[thisNode.id] && nodes[parent]) {
		if (!isDir) {
			const items = nodes[parent].items;
			const firstDirIdx = items
				.map(({ id }) => nodes[id])
				.findIndex((node) => node.isDir);
			console.log("[hf]", { firstDirIdx, items });
			if (firstDirIdx >= 0) {
				nodes[parent].items = [
					...items.slice(0, firstDirIdx),
					{
						id: thisNode.id,
					},
					...items.slice(firstDirIdx),
				];
			} else {
				nodes[parent].items.push({
					id: thisNode.id,
				});
			}
			console.log("[hf]", { parentItems: nodes[parent].items });
		} else {
			nodes[parent].items.push({
				id: thisNode.id,
			});
		}
	}

	if (nodes[thisNode.id]) {
		if (thisNode.items) {
			nodes[thisNode.id].items.unshift(...thisNode.items);
		}
	} else {
		nodes[thisNode.id] = thisNode;
	}

	if (isDir) {
		const pageNodes: Node[] = pages.values.map(
			(page: Record<string, any>) => ({
				id: page.file.path,
				link: page.file.path,
				name: page.file.name,
				isDir: false,
			})
		);
		pageNodes.forEach((pageNode) => {
			nodes[pageNode.id] = pageNode;
		});
	}
	console.log("[hf] doing it", { nodes });

	return nodes;
};

export const handleRename = (
	oldPath: string,
	newPath: string,
	nodes: Record<string, Node>,
	skipUpdateParent = false
) => {
	console.log("[hf] handleRename", { oldPath, newPath, nodes });
	let newNodes = nodes;
	const pathParts = oldPath.split("/");
	pathParts.pop();
	const newName = newPath.split("/").pop();
	const parentId = pathParts.join("/");

	const existingNode = newNodes[oldPath];
	delete newNodes[oldPath];

	const newItems: Node["items"] = [];

	if (existingNode.isDir) {
		existingNode.items?.forEach((item) => {
			const { id: oldItemPath } = item;
			const oldItemNode = newNodes[oldItemPath];
			const itemName = oldItemPath.split("/").pop();
			const newItemPath = [newPath, itemName].join("/");
			if (oldItemNode.isDir) {
				const [updatedNodes] = handleRename(
					oldItemPath,
					newItemPath,
					{ ...newNodes },
					true
				);
				newNodes = updatedNodes;
			} else {
				delete newNodes[oldItemPath];
				newNodes[newItemPath] = {
					id: newItemPath,
					name: itemName as string,
					link: newItemPath,
					isDir: false,
				};
			}
			newItems.push({ id: newItemPath });
		});
	}

	const newNode = {
		...existingNode,
		id: newPath,
		name: newName as string,
		link: existingNode.isDir ? undefined : newPath,
		items: existingNode.isDir ? newItems : undefined,
	};

	newNodes[newPath] = newNode;

	console.log("[hf] handleRename", { skipUpdateParent });
	if (!skipUpdateParent) {
		const parent = newNodes[parentId];

		const parentItems = parent && parent.items;

		console.log("[hf] handleRename", { parentItems });

		const idxInParentItems = parentItems?.findIndex(
			(ref) => ref.id === oldPath
		);
		console.log("[hf] handleRename", {
			parent,
			parentItems,
			idxInParentItems,
		});
		if (parentItems && idxInParentItems >= 0) {
			newNodes[parentId] = {
				...parent,
				items: [
					...parentItems.slice(0, idxInParentItems),
					{ id: newPath },
					...parentItems.slice(idxInParentItems + 1),
				],
			};
		}

		console.log("[hf]", { newParentItems: newNodes[parentId].items });
	}

	return [newNodes, newNode] as const;
};
