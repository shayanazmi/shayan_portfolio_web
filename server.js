import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Behold.so CORS proxy endpoint
    if (pathname === '/api/behold') {
        const feedUrl = parsedUrl.searchParams.get('url') || 'https://feeds.behold.so/LjnCeNbAX8rX7T8X7acZ';
        https.get(feedUrl, (bRes) => {
            let body = '';
            bRes.on('data', chunk => body += chunk);
            bRes.on('end', () => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(body);
            });
        }).on('error', (err) => {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        });
        return;
    }

    // Instagram CORS proxy endpoint
    if (pathname === '/api/ig') {
        const username = parsedUrl.searchParams.get('username') || 'shayan.azmi';
        const igUrl = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`;

        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'x-ig-app-id': '936619743392459',
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        };

        https.get(igUrl, options, (igRes) => {
            let body = '';
            igRes.on('data', chunk => body += chunk);
            igRes.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    const user = parsed?.data?.user;
                    if (!user) {
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, error: 'User profile not found' }));
                        return;
                    }

                    const edges = user.edge_owner_to_timeline_media?.edges || [];
                    const posts = edges.slice(0, 6).map(e => ({
                        id: e.node.id,
                        shortcode: e.node.shortcode,
                        displayUrl: e.node.display_url,
                        caption: e.node.edge_media_to_caption?.edges[0]?.node?.text || ''
                    }));

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, username, posts }));
                } catch (e) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Failed to parse Instagram response' }));
                }
            });
        }).on('error', (err) => {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message }));
        });
        return;
    }

    // Serve static files
    let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`[Portfolio Server] Listening on http://localhost:${PORT}`);
});
