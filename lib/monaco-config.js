// Monaco configuration file
import { loader } from "@monaco-editor/react";

// Configure Monaco to use a specific version that's known to work
// Version 0.45.0 is stable and has proper CSS support
loader.config({
    paths: {
        vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs'
    }
});

export default loader;

