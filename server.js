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
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);

    // API Endpoint: /api/ig
    if (parsedUrl.pathname === '/api/ig') {
        const username = parsedUrl.searchParams.get('username') || 'letsclicksomephotos';
        
        const options = {
            hostname: 'www.instagram.com',
            path: `/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'x-ig-app-id': '936619743392459',
                'Accept': 'application/json'
            }
        };

        https.get(options, (igRes) => {
            let data = '';
            igRes.on('data', chunk => data += chunk);
            igRes.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const edges = json.data?.user?.edge_owner_to_timeline_media?.edges || [];
                    
                    const posts = edges.slice(0, 6).map(e => {
                        const node = e.node;
                        const caption = node.edge_media_to_caption?.edges?.[0]?.node?.text || '';
                        return {
                            id: node.id,
                            shortcode: node.shortcode,
                            link: `https://www.instagram.com/p/${node.shortcode}/`,
                            url: node.display_url,
                            title: caption,
                            alt: caption ? caption.substring(0, 60) : 'Instagram Photo'
                        };
                    });

                    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                    res.end(JSON.stringify({ success: true, count: posts.length, posts }));
                } catch (err) {
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

    // Static File Serving
    let filePath = path.join(__dirname, parsedUrl.pathname === '/' ? 'index.html' : parsedUrl.pathname);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
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
    console.log(`Server running at http://localhost:${PORT}`);
});
