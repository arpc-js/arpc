import http from 'http';
import { readdir } from 'fs/promises';
import fs from 'fs';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';
import ts from 'typescript';
import { URL } from 'url';
import { AsyncLocalStorage } from 'async_hooks';
import { IncomingForm, File } from 'formidable';
import jwt from 'jsonwebtoken';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const controllerCache: Record<string, any> = {};
export const controllers: Record<string, any> = {};

interface ContextData {
    req: http.IncomingMessage;
    res: http.ServerResponse;
    traceId: string;
    uid?: number;  // 变成可选
}

const asyncLocalStorage = new AsyncLocalStorage<ContextData>();

export const ctx = {
    get store() {
        return asyncLocalStorage.getStore();
    },
    get req() {
        return this.store?.req;
    },
    get res() {
        return this.store?.res;
    },
    get traceId() {
        return this.store?.traceId;
    },
    get uid() {
        return this.store?.uid;
    },
    info(...args: any[]) {
        const time = new Date().toISOString();
        console.info(`[${time}][INFO][${this.traceId ?? 'no-trace'}]`, ...args);
    },
    err(...args: any[]) {
        const time = new Date().toISOString();
        console.error(`[${time}][ERROR][${this.traceId ?? 'no-trace'}]`, ...args);
    },
    debug(...args: any[]) {
        const time = new Date().toISOString();
        console.debug(`[${time}][DEBUG][${this.traceId ?? 'no-trace'}]`, ...args);
    },
};

// ---------------------------------
// Request 类，封装 IncomingMessage，支持 async 读取 body，并支持 multipart/form-data 文件上传解析（改用 formidable）
class Request {
    req: http.IncomingMessage;
    method: string;
    url: string;
    headers: http.IncomingHttpHeaders;
    private _bodyPromise?: Promise<Buffer>;

    constructor(req: http.IncomingMessage) {
        this.req = req;
        this.method = req.method || 'GET';
        this.url = req.url || '/';
        this.headers = req.headers;
    }

    arrayBuffer(): Promise<Buffer> {
        if (!this._bodyPromise) {
            this._bodyPromise = new Promise((resolve, reject) => {
                const chunks: Buffer[] = [];
                this.req.on('data', chunk => chunks.push(chunk));
                this.req.on('end', () => resolve(Buffer.concat(chunks)));
                this.req.on('error', reject);
            });
        }
        return this._bodyPromise;
    }

    async text(): Promise<string> {
        const buf = await this.arrayBuffer();
        return buf.toString('utf-8');
    }

    async json(): Promise<any> {
        const txt = await this.text();
        return JSON.parse(txt);
    }

    // 支持 multipart/form-data 和 application/x-www-form-urlencoded
    async formData(): Promise<{
        fields: Record<string, string>,
        files: Record<string, { filename: string, mimetype: string, data: Buffer }>
    }> {
        const contentType = this.headers['content-type'] || '';

        if (contentType.startsWith('application/x-www-form-urlencoded')) {
            const txt = await this.text();
            const map = new Map<string, string>();
            new URLSearchParams(txt).forEach((value, key) => {
                map.set(key, value);
            });
            const fields: Record<string, string> = {};
            map.forEach((v, k) => fields[k] = v);
            return { fields, files: {} };
        }

        if (contentType.startsWith('multipart/form-data')) {
            return new Promise((resolve, reject) => {
                const form = new IncomingForm({
                    maxFileSize: 20 * 1024 * 1024, // 20MB
                    keepExtensions: true,
                });

                const fields: Record<string, string> = {};
                const files: Record<string, { filename: string, mimetype: string, data: Buffer }> = {};

                form.parse(this.req, async (err, flds, fls) => {
                    if (err) return reject(err);

                    for (const [k, v] of Object.entries(flds)) {
                        fields[k] = Array.isArray(v) ? v[0] : v as string;
                    }

                    for (const [k, f] of Object.entries(fls)) {
                        const file = Array.isArray(f) ? f[0] : f as File;
                        if (!file || !file.filepath) continue;

                        try {
                            const buffer = await fs.promises.readFile(file.filepath);
                            files[k] = {
                                filename: file.originalFilename || '',
                                mimetype: file.mimetype || '',
                                data: buffer,
                            };
                        } catch (readErr) {
                            reject(readErr);
                            return;
                        }
                    }

                    resolve({ fields, files });
                });
            });
        }

        throw new Error(`Unsupported content-type for formData: ${contentType}`);
    }
}

// ---------------------------------
// Response 类，封装 ServerResponse，简化写法
class Response {
    res: http.ServerResponse;
    private _headersSent = false;

    constructor(res: http.ServerResponse) {
        this.res = res;
    }

    status(code: number): this {
        this.res.statusCode = code;
        return this;
    }

    setHeader(name: string, value: string): this {
        if (!this._headersSent) {
            this.res.setHeader(name, value);
        }
        return this;
    }

    json(data: any): void {
        if (!this._headersSent) {
            this.setHeader('Content-Type', 'application/json');
            this._headersSent = true;
            this.res.end(JSON.stringify(data));
        }
    }

    text(data: string): void {
        if (!this._headersSent) {
            this.setHeader('Content-Type', 'text/plain');
            this._headersSent = true;
            this.res.end(data);
        }
    }
}

// ---------- 以下保留你的工具函数及类型注入 ----------

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function isBasicType(type: string): boolean {
    return ['string', 'number', 'boolean', 'bigint', 'any', 'unknown'].includes(type);
}

function castBasicValue(value: any, type: string): any {
    switch (type) {
        case 'string': return String(value);
        case 'number': return Number(value);
        case 'boolean': return Boolean(value);
        case 'bigint': return BigInt(value as string | number);
        default: return value;
    }
}

function extractTypesFromFile(filePath: string): Record<string, Record<string, string>> {
    const sourceText = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true);
    const result: Record<string, Record<string, string>> = {};
    function visit(node: ts.Node) {
        if (ts.isClassDeclaration(node) && node.name) {
            const className = node.name.text;
            const fields: Record<string, string> = {};
            node.members.forEach(member => {
                if (ts.isPropertyDeclaration(member) && member.name && ts.isIdentifier(member.name)) {
                    const propName = member.name.text;
                    let typeStr = 'any';
                    if (member.type) {
                        typeStr = member.type.getText(sourceFile);
                    }
                    fields[propName] = typeStr;
                }
            });
            result[className] = fields;
        }
        ts.forEachChild(node, visit);
    }
    visit(sourceFile);
    return result;
}

async function loadAndInjectTypes(name: string): Promise<any> {
    if (!name || name === 'any' || name === 'unknown') {
        return class Dummy {};
    }

    if (controllerCache[name]) return controllerCache[name];

    let typesMap: Record<string, string> = {};
    try {
        typesMap = extractTypesFromFile(`${conf.rpcDir}/${capitalize(name)}.ts`)[capitalize(name)] || {};
    } catch (e) {
        console.warn(`[Type Extract Warning] Failed for ${name}:`, (e as Error).message);
    }

    try {
        const mod = await import(pathToFileURL(`${conf.rpcDir}/${capitalize(name)}.ts`).toString());
        const Cls = mod.default ?? mod[capitalize(name)];
        Cls.types = typesMap;
        controllerCache[name] = Cls;
        return Cls;
    } catch (e) {
        console.warn(`[Load Failed] Cannot load ${name}.js`, (e as Error).message);
        return class Dummy {};
    }
}

async function deepAssign(instance: any, data: any): Promise<any> {
    const types = instance.constructor.types || {};
    for (const key in data) {
        if (key === 'args') continue;
        const value = data[key];
        const declared = types[key];
        if (key === 'sel' && Array.isArray(value)&&value.length>0) {
            instance.setSel(...await Promise.all(value.map(convertJsonToSelInstance)));
            continue;
        }
        // ---------- 原逻辑 ----------
        if (typeof declared === 'string') {
            if (declared.endsWith('[]') && Array.isArray(value)) {
                const itemType = declared.slice(0, -2).trim();
                if (!itemType || itemType === 'any' || itemType === 'unknown') {
                    // 不处理类型（直接赋值）
                    instance[key] = value;
                } else if (isBasicType(itemType)) {
                    instance[key] = value.map((v: any) => castBasicValue(v, itemType));
                } else {
                    const Cls = await loadAndInjectTypes(itemType);
                    instance[key] = await Promise.all(value.map((v: any) => deepAssign(new Cls(), v)));
                }
            } else if (isBasicType(declared)) {
                instance[key] = castBasicValue(value, declared);
            } else {
                const Cls = await loadAndInjectTypes(declared);
                instance[key] = await deepAssign(new Cls(), value);
            }
        } else {
            instance[key] = value;
        }
    }

    return instance;
}


// ------------ 最核心的 oapi ------------
let conf:{ rpcDir?: string } = {}
export function oapi(options: { rpcDir?: string } = {}) {
    const middlewares: Function[] = [];
    options.rpcDir = options.rpcDir ?? 'src/api';
    conf=options
    return {
        use(mw: (req: Request, res: Response, next: () => Promise<void>) => Promise<void> | void) {
            middlewares.push(mw);
        },

        async listen(port = 3000) {
            const files = await readdir(conf.rpcDir);
            await Promise.all(files
                .filter(f => f.endsWith('.js') || f.endsWith('.ts'))
                .map(async file => {
                    const name = file.replace(/\.(js|ts)$/, '').toLowerCase();
                    controllers[name] = await loadAndInjectTypes(name);
                }));

            const server = http.createServer(async (req, res) => {
                const traceId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
                asyncLocalStorage.run({ req, res, traceId }, async () => {
                    const request = new Request(req);
                    const response = new Response(res);

                    let index = -1;

                    const parsedUrl = new URL(req.url || '', `http://${req.headers.host}`);
                    const pathname = parsedUrl.pathname || '/';

                    const next = async () => {
                        index++;
                        if (index < middlewares.length) {
                            await middlewares[index](request, response, next);
                        } else {
                            const [_, ctrlNameLower, methodName] = pathname.split('/');
                            const Ctrl = controllers[ctrlNameLower];
                            if (!Ctrl || typeof Ctrl.prototype[methodName] !== 'function') {
                                response.status(404).text('Not Found');
                                return;
                            }

                            let data: any = {};
                            try {
                                if (request.method === 'GET') {
                                    data = Object.fromEntries(parsedUrl.searchParams);
                                } else if (request.method === 'POST') {
                                    const ct = request.headers['content-type'] || '';
                                    if (ct.includes('application/json')) {
                                        data = await request.json();
                                    } else if (ct.includes('application/x-www-form-urlencoded')) {
                                        const form = await request.formData();
                                        data = form.fields;
                                    } else if (ct.includes('multipart/form-data')) {
                                        const form = await request.formData();
                                        // fields + files 都传给控制器
                                        data = {
                                            ...form.fields,
                                            ...form.files,
                                        };
                                    } else {
                                        const txt = await request.text();
                                        try {
                                            data = JSON.parse(txt);
                                        } catch {
                                            data = txt;
                                        }
                                    }
                                } else {
                                    response.status(405).text('Method Not Allowed');
                                    return;
                                }
                            } catch (e: any) {
                                response.status(400).json({ error: e.message || 'Bad Request' });
                                return;
                            }
                            const instance = await deepAssign(new Ctrl(), data);
                            const args = Array.isArray(data.args) ? data.args : [data];
                            const result = await instance[methodName](...args);
                            response.status(200).json(result);
                        }
                    }
                    await next();
                });
            });
            server.listen(port, () => {
                console.log(`Server running at http://localhost:${port}`);
            });
        }
    };
}
async function convertJsonToSelInstance(item: any): Promise<any> {
    if (
        typeof item === 'object' &&
        item !== null &&
        'model' in item &&
        'sel' in item &&
        typeof item.model === 'string' &&
        Array.isArray(item.sel)
    ) {
        const Cls = await loadAndInjectTypes(item.model);
        const items = await Promise.all(item.sel.map(convertJsonToSelInstance));
        console.log('items:', items);
        return Cls.sel(...items);
    }
    return item;
}

// 跨域中间件工厂
// 鉴权中间件工厂，传入期望的token
// 可配置：白名单和密钥
export function auth(whitelist: string[] = [], jwtSecret: string) {
    return async (req: any, res: any, next: () => Promise<void>) => {
        ctx.info(`请求: [${req.method}] ${req.url}`);

        if (whitelist.includes('*') || whitelist.includes(req.url)) {
            await next();
            ctx.info(`响应完成: [${req.method}] ${req.url}`);
            return;
        }

        const authHeader = req.headers["authorization"];
        if (!authHeader) {
            ctx.info("缺少 Authorization 头");
            res.status(401).json({ error: "Token missing" });
            return;
        }

        const [scheme, token] = authHeader.split(' ');
        if (scheme !== 'Bearer' || !token) {
            ctx.info("Authorization 格式错误");
            res.status(401).json({ error: "Invalid auth header format" });
            return;
        }

        try {
            const decoded = jwt.verify(token, jwtSecret);
            ctx.store && (ctx.store.uid = decoded.uid);
            ctx.info(`验证成功: uid=${decoded.uid}`);
        } catch (err: any) {
            ctx.info(`Token 无效或过期: ${err.message}`);
            res.status(401).json({ error: "Token invalid or expired" });
            return;
        }
        // 🟢 真正的路由执行放在验证通过之后，独立 try-catch（如有需要）或者交由上层处理
        await next();
        ctx.info(`响应完成: [${req.method}] ${req.url}`);
    };
}
interface CorsOptions {
    origin?: string | string[];              // 允许的来源，默认 '*'
    methods?: string[];                      // 允许的方法，默认常用的几个
    allowedHeaders?: string[];               // 允许的请求头，默认 Content-Type, Authorization
    allowCredentials?: boolean;              // 是否允许携带 cookie，默认 false
    maxAge?: number;                         // 预检请求缓存时间，默认 0
}

export function cors(options: CorsOptions = {}) {
    const {
        origin = '*',
        methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders = ['Content-Type', 'Authorization'],
        allowCredentials = false,
        maxAge = 0,
    } = options;

    return async (req: any, res: any, next: () => Promise<void>) => {
        const requestOrigin = req.headers.origin;

        // 处理 origin
        if (origin === '*') {
            res.setHeader('Access-Control-Allow-Origin', '*');
        } else if (typeof origin === 'string') {
            res.setHeader('Access-Control-Allow-Origin', origin);
        } else if (Array.isArray(origin)) {
            if (requestOrigin && origin.includes(requestOrigin)) {
                res.setHeader('Access-Control-Allow-Origin', requestOrigin);
            }
        }

        if (allowCredentials) {
            res.setHeader('Access-Control-Allow-Credentials', 'true');
        }

        res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(', '));
        res.setHeader('Access-Control-Allow-Methods', methods.join(', '));

        if (maxAge > 0) {
            res.setHeader('Access-Control-Max-Age', String(maxAge));
        }

        if (req.method === 'OPTIONS') {
            res.status(204).text('');
            return; // 结束预检请求
        }

        await next();
    };
}
export async function onError(req,  res, next: () => Promise<void>) {
    try {
        await next();
    } catch (err: any) {
        ctx.err( err.message||err);
        ctx.err( err.stack);
        //res.status(400).json({error: err.message||err || 'Bad Request'});
        res.status(400).text(err.message||err || 'Bad Request')
    }
}
