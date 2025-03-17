import {plugin} from "bun";
import {meta_plugin} from "./src/core/build_plugin.ts";
plugin(meta_plugin);
await Bun.build({
    entrypoints: ['./src/index.ts'],
    outdir: './build',
    plugins: [meta_plugin],
    target:"bun"
})
