<script lang="ts">
	import { flip } from "svelte/animate";
	import { dndzone, SHADOW_PLACEHOLDER_ITEM_ID } from "svelte-dnd-action";
	import type MyPlugin from "./main";
	import type { AppData, FileNode, DirNode } from "./types";
	import store from "./store";
	import CollapseIcon from "Components/SVG/IconWrapper.svelte";
	import { isDirNode } from "./utils";

	export let nodes: Record<string, FileNode | DirNode>;
	export let node: FileNode | DirNode | undefined;
	export let appData: AppData;
	export let origin: string | undefined;
	export let id: string | undefined;

	$: collapseExpanded = node && isDirNode(node) && node.expanded;
	let plugin: MyPlugin;
	store.plugin.subscribe((p) => (plugin = p));

	const flipDurationMs = 300;

	function handleChangeExpanded() {
		if (node) {
			const newNode = {
				...node,
				expanded: !collapseExpanded,
			};
			node = newNode;
			nodes = {
				...nodes,
				[node.id]: newNode,
			};
			origin &&
				plugin.saveData({
					...appData,
					[origin]: nodes,
				});
		}
	}
	function handleDndConsider(e: any) {
		console.log("[hf] dnd consider", { e, node });
		if (node && isDirNode(node)) {
			node.items = e.detail.items;
		}
	}
	async function handleDndFinalize(e: any) {
		console.log("[hf] dnd finalize", { e, node });
		if (node && isDirNode(node)) {
			node.items = e.detail.items;
		}
		nodes = { ...nodes };
		if (origin) {
			await plugin.saveData({
				...appData,
				[origin]: nodes,
			});
		}
	}
</script>

{#if node}
	{#if !isDirNode(node)}
		<div class="indent">
			<a
				href={node.link}
				rel="noopener"
				target="_blank"
				class="internal-link"
				data-href={node.link}
			>
				<b>{node.name}</b>
			</a>
		</div>
	{:else}
		<div class="indent">
			<button class="collapseButton" on:click={handleChangeExpanded}>
				<CollapseIcon direction={collapseExpanded ? "s" : "e"} />

				<h4>{node.name}</h4>
			</button>

			{#if !!node.items && !!node.items.length && collapseExpanded}
				<ol
					use:dndzone={{
						items: node.items,
						flipDurationMs,
						centreDraggedOnCursor: true,
					}}
					on:consider={handleDndConsider}
					on:finalize={handleDndFinalize}
				>
					<!-- <CollapseSection expanded={collapseExpanded}> -->
					<!-- WE FILTER THE SHADOW PLACEHOLDER THAT WAS ADDED IN VERSION 0.7.4, filtering this way rather than checking whether 'nodes' have the id became possible in version 0.9.1 -->
					{#each node.items.filter((item) => item.id !== SHADOW_PLACEHOLDER_ITEM_ID) as item (item.id)}
						<li
							animate:flip={{ duration: flipDurationMs }}
							class="item"
						>
							<svelte:self
								bind:nodes
								node={nodes[item.id]}
								{appData}
								{origin}
								id={item.id}
							/>
						</li>
					{/each}
					<!-- </CollapseSection> -->
				</ol>
			{/if}
		</div>
	{/if}
{/if}

<style>
	section {
		width: auto;
		/* max-width: 400px; */
		border: 0px solid black;
		padding: 0.4em;
		/* this will allow the dragged element to scroll the list */
		overflow-y: auto;
		height: auto;
		background-color: rgba(100, 100, 100, 0.1);
		overflow-wrap: break-word;
	}
	h4 {
		margin-left: 0.3em;
		text-align: left;
	}
	div {
		width: 90%;
		padding: 0.3em;
		border: 0px solid blue;
		margin: 0.15em 0;
	}
	.item {
		background-color: rgba(00, 100, 100, 0.1);
	}
	.collapseButton {
		background: none;
		color: inherit;
		border: none;
		padding: 0 !important;
		font: inherit;
		cursor: pointer;
		outline: inherit;
		overflow-wrap: break-word;
		white-space: normal;
		height: auto;
	}
</style>
