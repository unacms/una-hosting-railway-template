const fs = require("fs");
const path = require("path");

// docker-compose.neo.yml bind-mounts these four files. Railway has no host
// mounts, so the same contents are written here before `yarn build`.
// A non-empty NEO_* file variable replaces that file verbatim. Otherwise the
// file is rendered from the job variables, matching ansible/templates/neo.
const root = "/app/packages/app/customization";

const files = {
    images: "config/images_allowlist.js",
    staticJs: "static.js",
    settings: "settings.js",
    css: "design/styles/global.css",
};

function log(message) {
    console.log(`[railway-entrypoint] ${message}`);
}

function write(rel, body) {
    const file = path.join(root, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, body.endsWith("\n") ? body : `${body}\n`);
    log(`wrote ${file}`);
}

function fileOverride(name) {
    const value = process.env[name];
    if (value == null || value === "")
        return null;
    return value;
}

function jsString(value) {
    return JSON.stringify(String(value ?? ""));
}

function htmlComponent(name, params, html) {
    return `const ${name} = (${params}) => {
    return (
        <div
            dangerouslySetInnerHTML={
                { __html: ${jsString(html)} }
            }
        />
    );
}
`;
}

function writeImages() {
    const override = fileOverride("NEO_IMAGES_ALLOWLIST_JS");
    if (override) {
        write(files.images, override);
        return;
    }
    const host = process.env.NEO_IMAGE_HOST || "";
    if (!host) {
        log("NEO_IMAGE_HOST empty; leaving images_allowlist.js");
        return;
    }
    write(files.images, `/** Next.js Image remotePatterns — hostname allowlist для next/image */
const ImageRemotePatternsCustom = [
    { protocol: 'http', hostname: ${jsString(host)}, pathname: '**' },
    { protocol: 'https', hostname: ${jsString(host)}, pathname: '**' },
];

module.exports = { ImageRemotePatterns: ImageRemotePatternsCustom };
`);
}

function writeStatic() {
    const override = fileOverride("NEO_STATIC_JS");
    if (override) {
        write(files.staticJs, override);
        return;
    }
    const logo = process.env.logo || "";
    const splash = process.env.splash_text_component || "";
    const join = process.env.join_text_component || "";
    const assignments = [];
    if (logo)
        assignments.push("staticDefault.logo = Logo");
    if (splash)
        assignments.push("staticDefault.splash_text = SplashTextComponent");
    if (join)
        assignments.push("staticDefault.join_text = JoinTextComponent");
    write(files.staticJs, `import { staticDefault } from 'app/default/static';

${htmlComponent("Logo", "{ mode = 'adaptive', colorMode = 'auto' }", logo)}
${htmlComponent("SplashTextComponent", "props", splash)}
${htmlComponent("JoinTextComponent", "props", join)}
${assignments.join("\n")}

export const staticComponents = staticDefault;
`);
}

function writeSettings() {
    const override = fileOverride("NEO_SETTINGS_JS");
    if (override) {
        write(files.settings, override);
        return;
    }
    const host = process.env.NEXT_PUBLIC_SOCKETS_HOST || "";
    const key = process.env.NEXT_PUBLIC_SOCKETS_KEY || "main";
    write(files.settings, `import { settingsDefault } from 'app/default/settings';

settingsDefault.config.sockets.host = ${jsString(host)};
settingsDefault.config.sockets.key = ${jsString(key)};

settingsDefault.config.api_keys.google_maps = '';
settingsDefault.config.api_keys.open_ai = '';
settingsDefault.config.api_keys.onesignal = '';
settingsDefault.config.api_keys.mapbox = '';

settingsDefault.layout.use_splash_page = true

settingsDefault.auth = {
    enabled: false,
    google: false,
    github: false,
    linkedin: false,
    x: false,
    passkey: false,
    saml: false,
};

settingsDefault.menu_items.menu_navbar = [
    { name: 'home', title: 'Home', link: '/', icon: 'House' },
    { name: 'about', title: 'About', link: '/about', icon: 'Info'},

];

export const settings = settingsDefault;
`);
}

function writeCss() {
    const override = fileOverride("NEO_GLOBAL_CSS");
    if (override) {
        write(files.css, override);
        return;
    }
    write(files.css, process.env.global_css_component || "");
}

writeImages();
writeStatic();
writeSettings();
writeCss();
