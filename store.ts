import { writable } from "svelte/store";
import type ExamplePlugin from "./main";

const plugin = writable<ExamplePlugin>();
const pagesMap = writable<Record<string, string>>();

export default { plugin, pagesMap };
