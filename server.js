const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs').promises;
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
dotenv.config();

const app = express();

const corsOptions = {
    origin: function (origin, callback) {
        // Cho phép requests không có origin (như mobile apps, postman, etc)
        if (!origin) {
            return callback(null, true);
        }

        try {
            const url = new URL(origin);
            // Kiểm tra domain chính
            const allowedDomains = [
                'di9x.net',
                'di9x.com',
                'matbao.support',
                'matbao.com'
            ];

            // Kiểm tra nếu domain kết thúc bằng một trong các allowed domains
            const isAllowed = allowedDomains.some(domain =>
                url.hostname === domain || // Exact domain match
                url.hostname.endsWith('.' + domain) // Subdomain match
            );

            // Cho phép localhost trong development
            const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';

            if (isAllowed || isLocalhost) {
                // console.log(`✅ Allowed origin: ${origin}`);
                callback(null, true);
            } else {
                // console.log(`❌ Blocked origin: ${origin}`);
                callback(new Error('Not allowed by CORS'));
            }
        } catch (error) {
            // console.error('Error parsing origin:', error);
            callback(new Error('Invalid origin'));
        }
    },
    methods: ['GET', 'POST'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Middleware để log requests
app.use((req, res, next) => {
    // console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - Origin: ${req.headers.origin}`);
    next();
});

// Danh sách IP được phép truy cập
const allowedIPs = [
    '127.0.0.1',     // localhost IPv4
    '::1',           // localhost IPv6
    '::ffff:127.0.0.1', // localhost IPv4 mapped to IPv6
    '113.162.157.50',
    '14.241.253.12', // IP công ty

    // Thêm các IP khác được phép truy cập
    '118.69.62.113', // IP công ty
    '115.79.213.185', // IP công ty
    '171.244.188.132',
    '171.253.249.105',
    '2001:ee0:5001:7760:3948:c084:ef02:4f5f',
];

// Tạo kết nối database
const db = new sqlite3.Database(path.join(__dirname, 'access_logs.db'), (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
    } else {
        console.log('Connected to SQLite database');
        // Tạo bảng nếu chưa tồn tại
        db.run(`CREATE TABLE IF NOT EXISTS access_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            ip TEXT NOT NULL,
            path TEXT NOT NULL,
            status TEXT NOT NULL
        )`);
    }
});

// Cập nhật middleware checkIP
const checkIP = (req, res, next) => {
    // Bỏ qua request favicon
    if (req.path === '/favicon.ico') {
        return next();
    }

    let clientIP = req.ip || req.connection.remoteAddress;

    // Xử lý IPv4 mapped to IPv6
    if (clientIP.startsWith('::ffff:')) {
        clientIP = clientIP.replace('::ffff:', '');
    }

    // console.log('Original IP:', req.ip);
    // console.log('Processed Client IP:', clientIP);

    const status = allowedIPs.includes(clientIP) ? 'success' : 'blocked';

    // Lưu log vào SQLite
    db.run(
        'INSERT INTO access_logs (ip, path, status) VALUES (?, ?, ?)',
        [clientIP, req.path, status],
        (err) => {
            if (err) {
                console.error('Error saving access log:', err);
            }
        }
    );

    if (!allowedIPs.includes(clientIP)) {
        console.log('Access denied for IP:', clientIP);
        return res.status(403).send(`
            <html>
                <head>
                    <title>Access Denied</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            margin: 0;
                            background-color: #f5f5f5;
                        }
                        .error-container {
                            text-align: center;
                            padding: 20px;
                            background: white;
                            border-radius: 8px;
                            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        }
                        h1 { color: #d32f2f; }
                        p { color: #666; }
                    </style>
                </head>
                <body>
                    <div class="error-container">
                        <h1>Access Denied</h1>
                        <p>Your IP (${clientIP}) is not authorized to access this service.</p>
                    </div>
                </body>
            </html>
        `);
    }
    next();
};

// Thêm trust proxy nếu bạn đang sử dụng proxy
app.set('trust proxy', true);

// Áp dụng middleware cho tất cả các routes
// app.use(checkIP);

app.use(express.json());
app.use(express.static('public'));


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get('/', (req, res) => {
    // res.send('Hello World');
    res.sendFile(path.join(__dirname, 'public/intro/index.html'));
});

app.get('/create-email', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/create-email/index.html'));
});

app.get('/ms365-file', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/ms365-file/index.html'));
});

app.get('/mbws', (req, res) => {
    res.status(400).send("Please provide a domain in the URL path.");
});

// Thêm route này vào server.js
app.get('/ai-email', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/AI-email-assistant/index.html'));
});

app.get('/get-tenantid', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/get-tenantID/index.html'));
});

app.get('/html-editor', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html-editor/index.html'));
});

app.get('/generator-bookmark', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public/generator-bookmark/index.html'));
});

app.get('/migration-365', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public/migration-365/index.html'));
});

app.get('/churchs-web', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public/churchs-website/index.html'));
});



app.get('/mbws/:domain', async (req, res) => {
    const domain = req.params.domain;

    try {
        let htmlContent = await fs.readFile(path.join(__dirname, 'public/mbws/main/index.html'), 'utf-8');

        // Replace {DOMAIN} with the actual domain
        htmlContent = htmlContent.replace(/{DOMAIN}/g, domain);

        // Create the DNS data with the actual domain
        const dnsData = [
            { name: 'autodiscover', type: 'CNAME', ttl: '3600', data: `mail.${domain}.` },
            { name: 'mail', type: 'CNAME', ttl: '3600', data: 'mcloud.vn.' },
            { name: '@', type: 'MX', ttl: '3600', data: '10 mcloud.vn.' },
            { name: '_sip._tls', type: 'SRV', ttl: '3600', data: `1 5 5061 mail.${domain}.` },
            { name: '_sip._udp', type: 'SRV', ttl: '3600', data: `1 5 5060 mail.${domain}.` },
            { name: '_caldav._tcp', type: 'SRV', ttl: '3600', data: `10 0 80 mail.${domain}.` },
            { name: '_carddav._tcp', type: 'SRV', ttl: '3600', data: `10 0 80 mail.${domain}.` },
            { name: '_xmpp-client._tcp', type: 'SRV', ttl: '3600', data: `10 0 5222 mail.${domain}.` },
            { name: '_caldavs._tcp', type: 'SRV', ttl: '3600', data: `10 0 443 mail.${domain}.` },
            { name: '_carddavs._tcp', type: 'SRV', ttl: '3600', data: `10 0 443 mail.${domain}.` },
            { name: '_ischedules._tcp', type: 'SRV', ttl: '3600', data: `10 0 443 mail.${domain}.` },
            { name: '_xmpp-server._tcp', type: 'SRV', ttl: '3600', data: `10 0 5269 mail.${domain}.` },
            { name: '_autodiscover._tcp', type: 'SRV', ttl: '3600', data: `10 0 443 mail.${domain}.` },
            { name: '_sip._tcp', type: 'SRV', ttl: '3600', data: `1 5 5060 mail.${domain}.` },
            { name: '_ischedule._tcp', type: 'SRV', ttl: '3600', data: `10 0 80 mail.${domain}.` },
            { name: 'default._domainkey', type: 'TXT', ttl: '3600', data: `v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDB+5+5061 mail.${domain}.` },
            { name: '@', type: 'TXT', ttl: '3600', data: `v=spf1 include:emailserver.vn -all` },

        ];

        // Replace {DNS_DATA} with the actual DNS data
        htmlContent = htmlContent.replace('{DNS_DATA}', JSON.stringify(dnsData));

        res.send(htmlContent);
    } catch (error) {
        console.error('Error reading HTML file:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.post('/ask', async (req, res) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = req.body.prompt;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ answer: text });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});

// Thêm route cho dashboard
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/dashboard/index.html'));
});

// API endpoint để lấy dữ liệu dashboard
app.get('/api/dashboard-data', (req, res) => {
    const queries = {
        totalAccess: 'SELECT COUNT(*) as count FROM access_logs',
        blockedAccess: 'SELECT COUNT(*) as count FROM access_logs WHERE status = "blocked"',
        blockedIPs: `
            SELECT ip, COUNT(*) as count 
            FROM access_logs 
            WHERE status = "blocked" 
            GROUP BY ip
        `,
        successfulIPs: `
            SELECT ip, COUNT(*) as count 
            FROM access_logs 
            WHERE status = "success" 
            GROUP BY ip
        `,
        lastAccesses: `
            SELECT timestamp, ip, path, status 
            FROM access_logs 
            ORDER BY timestamp DESC 
            LIMIT 10
        `
    };

    const dashboardData = {
        totalAccess: 0,
        blockedAccess: 0,
        successfulAccess: 0,
        blockedIPs: [],
        successfulIPs: [],
        lastAccesses: [],
        blockRate: '0'
    };

    // Thực hiện các truy vấn song song
    Promise.all([
        new Promise((resolve, reject) => {
            db.get(queries.totalAccess, (err, row) => {
                if (err) reject(err);
                dashboardData.totalAccess = row.count;
                resolve();
            });
        }),
        new Promise((resolve, reject) => {
            db.get(queries.blockedAccess, (err, row) => {
                if (err) reject(err);
                dashboardData.blockedAccess = row.count;
                resolve();
            });
        }),
        new Promise((resolve, reject) => {
            db.all(queries.blockedIPs, (err, rows) => {
                if (err) reject(err);
                dashboardData.blockedIPs = rows;
                resolve();
            });
        }),
        new Promise((resolve, reject) => {
            db.all(queries.successfulIPs, (err, rows) => {
                if (err) reject(err);
                dashboardData.successfulIPs = rows;
                resolve();
            });
        }),
        new Promise((resolve, reject) => {
            db.all(queries.lastAccesses, (err, rows) => {
                if (err) reject(err);
                dashboardData.lastAccesses = rows;
                resolve();
            });
        })
    ])
        .then(() => {
            // Tính toán các giá trị phụ thuộc
            dashboardData.successfulAccess = dashboardData.totalAccess - dashboardData.blockedAccess;
            dashboardData.blockRate = ((dashboardData.blockedAccess / dashboardData.totalAccess) * 100).toFixed(2);
            res.json(dashboardData);
        })
        .catch(err => {
            console.error('Error fetching dashboard data:', err);
            res.status(500).json({ error: 'Internal server error' });
        });
});

// Thêm function để xóa logs cũ (tùy chọn)
function cleanOldLogs() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    db.run(
        'DELETE FROM access_logs WHERE timestamp < ?',
        [thirtyDaysAgo.toISOString()],
        (err) => {
            if (err) {
                console.error('Error cleaning old logs:', err);
            } else {
                console.log('Old logs cleaned successfully');
            }
        }
    );
}

// Chạy cleanup mỗi ngày
setInterval(cleanOldLogs, 24 * 60 * 60 * 1000);

// Thêm queries cho biểu đồ
app.get('/api/chart-data', (req, res) => {
    const queries = {
        hourly: `
            SELECT 
                strftime('%H', timestamp) as hour,
                COUNT(*) as total,
                SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked
            FROM access_logs 
            WHERE timestamp >= datetime('now', '-24 hours')
            GROUP BY hour
            ORDER BY hour
        `,
        daily: `
            SELECT 
                date(timestamp) as date,
                COUNT(*) as total,
                SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked
            FROM access_logs 
            WHERE timestamp >= datetime('now', '-30 days')
            GROUP BY date
            ORDER BY date
        `
    };

    Promise.all([
        new Promise((resolve, reject) => {
            db.all(queries.hourly, (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        }),
        new Promise((resolve, reject) => {
            db.all(queries.daily, (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        })
    ])
        .then(([hourlyData, dailyData]) => {
            res.json({ hourlyData, dailyData });
        })
        .catch(err => {
            console.error('Error fetching chart data:', err);
            res.status(500).json({ error: 'Internal server error' });
        });
});

app.post('/api/getDomainId', async (req, res) => {
    try {
        const domain = req.body.domain;

        const apiUrl = `https://login.windows.net/${domain}/.well-known/openid-configuration`;
        const response = await axios.get(apiUrl);
        const issuer = response.data.issuer;
        const id = issuer.split('/').slice(-2)[0];

        res.json({ success: true, id: id });
    } catch (error) {
        res.json({
            success: false,
            error: error.message,
            domain: req.body.domain,
            details: {
                status: error.response?.status,
                statusText: error.response?.statusText
            }
        });
    }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));