<script lang="ts">
	import List from "./List.svelte";
	import { onMount, onDestroy } from "svelte";
	import type MyPlugin from "./main";
	import store from "./store";
	import * as Dataview from "obsidian-dataview";
	import { TFile, type MarkdownPostProcessorContext } from "obsidian";
	import type { Node, FileNode, DirNode, AppData } from "./types";
	import { updateNodes, deleteFromNodes, handleRename } from "./utils";

	export let ctx: MarkdownPostProcessorContext;
	let nodes: Record<string, FileNode | DirNode> = {};
	let origin: string | undefined;
	let curPath: string | undefined;
	$: rootNode = origin && nodes[origin];

	let plugin: MyPlugin;
	let appData: AppData;
	let unsubscribe: () => void;

	$: {
		console.log("[hf] component", { nodes });
	}

	onMount(() => {
		let internalNodes: Record<string, FileNode | DirNode> = {};
		unsubscribe = store.plugin.subscribe(async (p) => {
			plugin = p;
			appData = await plugin.loadData();
			const app = plugin.app;
			const DataviewAPI = Dataview?.getAPI(app);
			const curFile = app.vault.getAbstractFileByPath(ctx.sourcePath);
			origin = curFile?.parent?.path;
			curPath = curFile?.path;

			if (origin && appData[origin]) {
				nodes = appData[origin];
			} else {
				const pagesByDir = DataviewAPI?.pages(`"${origin}"`)
					.filter((page) => page.file.path !== curPath)
					.sort((page) => page.file.ctime.ts, "asc")
					.groupBy((page) => page.file.folder)
					.sort((group) => group.rows[0].file.ctime.ts, "asc");

				pagesByDir?.forEach((dir) => {
					const dirPath = dir.key;
					updateNodes(dirPath, dir, internalNodes);
				});

				nodes = internalNodes;
				if (origin) {
					plugin.saveData({
						...appData,
						[origin]: internalNodes,
					});
				}
			}

			plugin.app.vault.on("create", (file) => {
				const { path } = file;
				if (!origin) {
					throw new Error("[create listener]: origin not defined");
				}
				if (path.includes(origin) && file instanceof TFile) {
					nodes = updateNodes(path, file, nodes);

					plugin.saveData({
						...appData,
						[origin]: nodes,
					});
				}
			});

			plugin.app.vault.on("delete", (file) => {
				const { path } = file;
				if (!origin) {
					throw new Error("[delete listener]: origin not defined");
				}
				if (path.includes(origin) && file instanceof TFile) {
					nodes = deleteFromNodes(path, nodes, origin);

					plugin.saveData({
						...appData,
						[origin]: nodes,
					});
				}
			});

			plugin.app.vault.on("rename", (file, oldPath) => {
				const { path: newPath } = file;

				if (!origin) {
					throw new Error("[rename listener]: origin not defined");
				}

				if (oldPath.includes(origin)) {
					const [newNodes] = handleRename(oldPath, newPath, {
						...nodes,
					});
					nodes = newNodes;
					plugin.saveData({
						...appData,
						[origin]: nodes,
					});
				}
			});
		});
	});

	onDestroy(() => {
		unsubscribe();
	});
</script>

<div>
	{#if !!rootNode}
		<List id={rootNode?.id} node={rootNode} {appData} {origin} bind:nodes />
	{/if}
</div>

<style>
	:global(.indent) {
		padding-left: 16px !important;
	}
</style>
