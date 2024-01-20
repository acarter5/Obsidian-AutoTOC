<script context="module">
	import pathsByName from "./icon-paths";
	export const iconOptions = Object.keys(pathsByName);
	export const directions = ["s", "e"];
</script>

<script>
	export let name = "chevronDown";
	export let direction = "s";

	$: paths = pathsByName[name] || [];
	$: rotation = directions.indexOf(direction) * -90;
</script>

<svg
	class="c"
	viewBox="0 0 30 30"
	clip-rule="evenodd"
	style={`transform: rotate(${rotation}deg)`}
>
	{#each paths as path}
		<path d={path} />
	{/each}
</svg>

<style>
	.c {
		width: 1em;
		height: 1em;
		fill: none;
		stroke: currentColor;
		transition: all 0.3s ease-out;
		overflow: visible;
	}
</style>
