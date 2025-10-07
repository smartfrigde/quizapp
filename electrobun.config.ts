export default {
    app: {
        name: "quiz",
        identifier: "me.smartfrigde.quiz",
        version: "0.0.1",
    },
    build: {
        views: {
            loadview: {
                entrypoint: "src/loadview/index.ts",
                external: [],
            },
            checkview: {
                entrypoint: "src/checkview/index.ts",
                external: [],
            }
        },
        copy: {
            "src/loadview/index.html": "views/loadview/index.html",
            "src/loadview/index.css": "views/loadview/index.css",
            "src/checkview/index.html": "views/checkview/index.html",
            "src/checkview/index.css": "views/checkview/index.css",
            "src/menuview/index.html": "views/menuview/index.html",
            "src/menuview/index.css": "views/menuview/index.css",
            "src/menuview/index.js": "views/menuview/index.js",
            "src/createview/index.html": "views/createview/index.html",
            "src/createview/index.css": "views/createview/index.css",
            "src/createview/index.js": "views/createview/index.js",
        },
        mac: {
            bundleCEF: true,
        },
        linux: {
            bundleCEF: false,
        },
        win: {
            bundleCEF: false,
        },
    },
};