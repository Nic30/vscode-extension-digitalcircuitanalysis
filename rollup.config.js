import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy'
import { nodeResolve } from '@rollup/plugin-node-resolve';

const production = false; //!process.env.ROLLUP_WATCH

const extensionConfig = {
    input: './src/extension.ts',
    output: {
        file: './out/extension.js',
        format: 'cjs',
        sourcemap: !production,
        globals: {
            // lib name: name where lib exports itself on "window"
            'vscode': 'vscode',
        },
    },
    external: [
        'vscode'
    ],
    plugins: [
        typescript({ sourceMap: !production, inlineSources: !production, tsconfig: "./src/tsconfig.json" })
    ]
};

const schedulingViewerConfig = {
    input: './src/media/hwscheduling.ts',
    output: {
        sourcemap: !production,
        format: 'umd',
        file: `media/hwscheduling.js`,
        globals: {
            // lib name: name where lib exports itself on "window"
            'vscode': 'vscode',
            "d3": "d3",
            'd3-hwschedulinggraphs': 'd3',
        },
        name: 'd3',
    },
    external: ['vscode', 'd3'],
    plugins: [
        typescript({ sourceMap: !production, inlineSources: !production, tsconfig: "./src/media/tsconfig.hwscheduling.json" }),
        copy({
           verbose: true,
           targets: [
             { src: 'node_modules/d3/dist/d3.min.js', dest: 'media/' },
             { src: 'node_modules/d3-hwschedulinggraphs/dist/d3-hwschedulinggraphs.js', dest: 'media/' },
             { src: 'src/media/hwscheduling.css', dest: 'media/' },
             { src: 'src/media/reset.css', dest: 'media/' },
             { src: 'src/media/vscode.css', dest: 'media/' },
             
             { src: 'node_modules/d3-hwschematic/dist/d3-hwschematic.js', dest: 'media/' },
             { src: 'node_modules/elkjs/lib/elk.bundled.js', dest: 'media/'},
             { src: 'node_modules/d3-hwschematic/dist/d3-hwschematic-dark.css', dest: 'media/' }
        ]})
    ]
};

const schemeViewerConfig = {
    input: './src/media/hwschematic.ts',
    output: {
        sourcemap: !production,
        format: 'umd',
        //format: "iife",
        file: `media/hwschematic.js`,
        globals: {
            // lib name: name where lib exports itself on "window"
            'vscode': 'vscode',
            "d3": "d3",
            'd3-hwschematic': 'd3',
            '@vscode/webview-ui-toolkit': 'webviewUiToolkit',
        },
        name: 'd3',
    },
    external: ['vscode', 'd3'],
    plugins: [
		nodeResolve(),
        typescript({ sourceMap: !production, inlineSources: !production, tsconfig: "./src/media/tsconfig.hwschematic.json" }),
        copy({
           verbose: true,
           targets: [
             { src: 'node_modules/d3-hwschematic/dist/d3-hwschematic.js', dest: 'media/' },
             { src: 'src/media/d3-hwschematic-dark.css', dest: 'media/' },
             { src: 'node_modules/elkjs/lib/elk.bundled.js', dest: 'media/' },
        ]})
    ]
};

const waveViewerConfig = {
    input: './src/media/wave.ts',
    output: {
        sourcemap: !production,
        format: 'umd',
        file: `media/wave.js`,
        globals: {
            // lib name: name where lib exports itself on "window"
            'vscode': 'vscode',
            "d3": "d3",
            'd3-wave': 'd3',
            '@fortawesome/free-solid-svg-icons': 'free-solid-svg-icons',
        },
        name: 'd3',
    },
    external: ['vscode', 'd3'],
    plugins: [
        typescript({ sourceMap: !production, inlineSources: !production, tsconfig: "./src/media/tsconfig.wave.json" }),
        copy({
           verbose: true,
           targets: [
             { src: 'node_modules/d3-wave/dist/d3-wave.js', dest: 'media/' },
             { src: 'node_modules/@fortawesome/free-solid-svg-icons/index.js', dest: 'media/@fortawesome/free-solid-svg-icons/' },
             
        ]})
    ]
};

export default [
    extensionConfig,
    schedulingViewerConfig,
    schemeViewerConfig,
    waveViewerConfig,
];
