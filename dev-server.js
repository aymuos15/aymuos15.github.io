import { extname, resolve } from 'node:path';

const port = Number(process.env.PORT || 3000);
const rootDir = resolve(import.meta.dir, 'src');

function resolvePath(pathname) {
    const relativePath = pathname === '/' ? 'index.html' : pathname.slice(1);
    const targetPath = resolve(rootDir, relativePath);

    if (targetPath !== rootDir && !targetPath.startsWith(`${rootDir}/`)) {
        return null;
    }

    return targetPath;
}

const server = Bun.serve({
    port,
    development: true,
    async fetch(req) {
        const url = new URL(req.url);
        const pathname = decodeURIComponent(url.pathname);
        const targetPath = resolvePath(pathname);

        if (!targetPath) {
            return new Response('Not found', { status: 404 });
        }

        const file = Bun.file(targetPath);

        if (await file.exists()) {
            return new Response(file);
        }

        if (!extname(pathname)) {
            const fallback = Bun.file(resolve(rootDir, 'index.html'));
            return new Response(fallback);
        }

        return new Response('Not found', { status: 404 });
    }
});

console.log(`Dev server running at http://localhost:${server.port}`);
