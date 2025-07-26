import http from 'http';
import { readdir } from 'fs/promises';
import fs from 'fs';
import { pathToFileURL } from 'url';
import ts from 'typescript';
import { URL } from 'url';
import { AsyncLocalStorage } from 'async_hooks';
import { IncomingForm, File } from 'formidable';
import jwt from 'jsonwebtoken';
import * as path from 'path';
import { existsSync } from 'fs';
import {init_class} from "./init_class_map.ts";

const controllerCache: Record<string, any> = {};
export let controllers: Record<string, any> = {};

interface ContextData {
    req: http.IncomingMessage;
    res: http.ServerResponse;
    traceId: string;
    uid?: number;  // 变成可选
}

const asyncLocalStorage = new AsyncLocalStorage<ContextData>();

export const ctx = {
    // 通用的 get 方法，通过传入 key 获取 store 中的数据
    get(key: string) {
        return this.store?.[key];
    },

    // 通用的 set 方法，通过传入 key 和 value 设置 store 中的数据
    set(key: string, value: any) {
        if (this.store) {
            this.store[key] = value;
        } else {
            console.warn(`Store is not initialized. Cannot set ${key}.`);
        }
    },
    get store() {
        return asyncLocalStorage.getStore();
    },
    get req():Request {
        return this.store?.req;
    },
    get res():Response {
        return this.store?.res;
    },
    get traceId() {
        return this.store?.traceId;
    },
    get uid() {
        return this.store?.uid;
    },
    log(level: string, ...args: any[]) {
        const time = new Date().toISOString();
        const trace = this.traceId ?? 'no-trace';
        const lvl = level.toUpperCase();

        const levelMethodMap: Record<string, keyof Console> = {
            FATAL: 'error',
            ERROR: 'error',
            WARN: 'warn',
            INFO: 'info',
            DEBUG: 'debug',
            TRACE: 'debug',   // TRACE用debug级别打印，区别在于语义
            VERBOSE: 'log',
        };

        const method = levelMethodMap[lvl] || 'log';
        const methodKey = method as keyof Console;
        const fn = console[methodKey];
        if (typeof fn === 'function') {
            if (args[0] instanceof Error) {
                fn.call(console, `[${time}][${lvl}][${trace}]`, args[0].message);
                if (args[0].stack) {
                    fn.call(console, args[0].stack);
                }
            } else {
                fn.call(console, `[${time}][${lvl}][${trace}]`, ...args);
            }
        } else {
            console.log(`[${time}][${lvl}][${trace}]`, ...args);
        }
    },
    info(...args: any[]) {
        this.log('INFO', ...args);
    },
    err(...args: any[]) {
        this.log('ERROR', ...args);
    },
    debug(...args: any[]) {
        this.log('DEBUG', ...args);
    },
    warn(...args: any[]) {
        this.log('WARN', ...args);
    },
    fatal(...args: any[]) {
        this.log('FATAL', ...args);
    },
    trace(...args: any[]) {
        this.log('TRACE', ...args);
    },
    verbose(...args: any[]) {
        this.log('VERBOSE', ...args);
    },
};

// ---------------------------------
// Request 类，封装 IncomingMessage，支持 async 读取 body，并支持 multipart/form-data 文件上传解析（改用 formidable）
export class Request {
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
export class Response {
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

    get headersSent(): boolean {
        return this._headersSent || this.res.headersSent;
    }

    json(data: any): void {
        if (this.headersSent) return;
        this.setHeader('Content-Type', 'application/json');
        this._headersSent = true;
        this.res.end(JSON.stringify(data));
    }

    text(data: string): void {
        if (this.headersSent) return;
        this.setHeader('Content-Type', 'text/plain; charset=utf-8');
        this._headersSent = true;
        this.res.end(data);
    }

    html(html: string): void {
        if (this.headersSent) return;
        this.setHeader('Content-Type', 'text/html; charset=utf-8');
        this._headersSent = true;
        this.res.end(html);
    }

    xml(xml: string): void {
        if (this.headersSent) return;
        this.setHeader('Content-Type', 'application/xml; charset=utf-8');
        this._headersSent = true;
        this.res.end(xml);
    }

    redirect(url: string, statusCode = 302): void {
        if (this.headersSent) return;
        this.status(statusCode);
        this.setHeader('Location', url);
        this._headersSent = true;
        this.res.end(`Redirecting to ${url}`);
    }

    send(data: string | Buffer, contentType = 'application/octet-stream'): void {
        if (this.headersSent) return;
        if (typeof data === 'string') {
            this.setHeader('Content-Type', 'text/plain; charset=utf-8');
        } else {
            this.setHeader('Content-Type', contentType);
        }
        this._headersSent = true;
        this.res.end(data);
    }

    file(filePath: string, contentType?: string): void {
        if (this.headersSent) return;
        fs.stat(filePath, (err, stats) => {
            if (err || !stats.isFile()) {
                this.status(404).text('File not found');
                return;
            }
            const ext = path.extname(filePath).toLowerCase();
            const defaultType = contentType || getMimeType(ext);

            this.setHeader('Content-Type', defaultType);
            this.setHeader('Content-Length', stats.size.toString());

            this._headersSent = true;

            const stream = fs.createReadStream(filePath);
            stream.pipe(this.res);
            stream.on('error', () => {
                this.res.statusCode = 500;
                this.res.end('Internal Server Error');
            });
        });
    }

    end(): void {
        if (!this.headersSent) {
            this._headersSent = true;
            this.res.end();
        }
    }
}

// 简单 MIME 类型映射，可扩展
function getMimeType(ext: string): string {
    const map: Record<string, string> = {
        '.html': 'text/html',
        '.json': 'application/json',
        '.txt': 'text/plain',
        '.xml': 'application/xml',
        '.jpg': 'image/jpeg',
        '.png': 'image/png',
        '.pdf': 'application/pdf',
        '.js': 'application/javascript',
        '.css': 'text/css',
    };
    return map[ext] || 'application/octet-stream';
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
    if (!name || name === 'any' || name === 'unknown'|| name === '{}') {
        return {};
    }
    if (name === '[]') {
        return [];
    }
    if (controllerCache[name]) return controllerCache[name];

    let typesMap: Record<string, string> = {};
    try {
        typesMap = extractTypesFromFile(`${conf.rpc_dir}/${capitalize(name)}.ts`)[capitalize(name)] || {};
    } catch (e) {
        console.warn(`[Type Extract Warning] Failed for ${name}:`, (e as Error).message);
    }

    try {
        const mod = await import(pathToFileURL(`${conf.rpc_dir}/${capitalize(name)}.ts`).toString());
        const Cls = mod.default ?? mod[capitalize(name)];
        Cls.types = typesMap;
        controllerCache[name] = Cls;
        return Cls;
    } catch (e) {
        console.warn(`[Load Failed] Cannot load ${name}.js`, (e as Error).message);
        return class Dummy {};
    }
}

//空对象{}，不进行deepAssign
async function deepAssign(instance: any, data: any): Promise<any> {
    const types = instance.constructor.types || {};
    for (const key in data) {
        if (key === 'args') continue;
        if (!(key in {...types,id:0,page:0,size:0,sel:null,created_at:undefined,updated_at:undefined,is_deleted:false})) continue; // 只处理定义过的字段
        const value = data[key];
        const declared = types[key];
/*        if (key === 'sel' && Array.isArray(value)&&value.length>0) {
            instance.setSel(...await Promise.all(value.map(convertJsonToSelInstance)));
            continue;
        }*/
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
            }else if (declared=='{}'||declared=='any'||declared=='unknown'){
                instance[key] =value
            }else {
                if (value && typeof value === 'object' && Object.keys(value).length > 0) {
                    const Cls = await loadAndInjectTypes(declared);
                    instance[key] = await deepAssign(new Cls(), value);
                }
            }
        } else {
            instance[key] = value;
        }
    }

    return instance;
}
interface MiddlewareContext {
    ctx: any;        // 你自己的上下文类型，比如 { traceId: string, user?: User } 等
    req: Request;
    res: Response;
    next: () => Promise<void>;
}

type Middleware = (params: MiddlewareContext) => Promise<void> | void;

// ------------ 最核心的 oapi ------------
let conf:{ rpc_dir?: string} = {}
export function Arpc(options: { rpc_dir?: string} = {}) {
    //重写promise原型链
    Promise.prototype.err = function (msg) {
        return this.catch(e => {
            const err = new Error(msg);
            err.stack += '\nCaused by: ' + (e.stack || e);
            throw err;
        });
    };
    const middlewares: Function[] = [];
    const root = process.cwd();
    const hasSrc = existsSync(path.join(root, 'src'));
    if (hasSrc){
        options.rpc_dir = options.rpc_dir ?? 'src/arpc';
    }else {
        options.rpc_dir = options.rpc_dir ?? 'arpc';
    }
    conf=options
    return {
        use(mw: Middleware) {
            middlewares.push(mw);
            return this
        },
        async listen(port = 3000) {
            const files = await readdir(conf.rpc_dir);
            controllers=await init_class(conf.rpc_dir)
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
                            await middlewares[index]({ctx,req:request, res:response, next});
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
                            //data只赋值对象有的，没有的不赋值
                            //args没传，就用data，支持对象和动态参数数组
                            let {args,...rest}=data
                            const instance = await deepAssign(new Ctrl(), rest);
                            if (data.args?.[0] == undefined){
                                args= Array.isArray(rest)?rest:[rest]
                            }
                            const result = await instance[methodName](...args);
                            if (result === undefined) {
                                return;
                            }
                            if (result instanceof Response) {
                                return;
                            }
                            if (typeof result=='string') {
                                response.status(200).text(result);
                                return;
                            }
                            if (typeof result === 'number' || typeof result === 'boolean') {
                                response.status(200).send(result.toString());
                                return;
                            }
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
export function jwt_sign(secret,payload,expiresIn='2h') {
    return jwt.sign(payload, secret, {expiresIn:expiresIn})
}
export function jwt_auth(secret: string, whitelist: string[] = []) {
    return async ({req,res,next}) => {
        ctx.info(`请求: [${req.method}] ${req.url}`);

        if (whitelist.includes('*') || whitelist.includes(req.url)) {
            await next();
            return;
        }

        const authHeader = req.headers["authorization"];
        if (!authHeader) {
            ctx.info("缺少 Authorization 头");
            res.status(401).text('Authorization issing');
            return;
        }

        const [scheme, token] = authHeader.split(' ');
        if (scheme !== 'Bearer' || !token) {
            ctx.info("Authorization 格式错误");
            res.status(401).text('Authorization format error');
            return;
        }

        try {
            const decoded = jwt.verify(token, secret);
            ctx.store && (ctx.store.uid = decoded.uid);
            ctx.info(`验证成功: uid=${decoded.uid}`);
        } catch (err: any) {
            ctx.info(`Token 无效或过期: ${err.message}`);
            res.status(401).text('Unauthorized');
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

    return async ({req,res,next}) => {
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
export async function onError({req,res,next}) {
    try {
        console.log(req.url)
        await next();
    } catch (err: any) {
        ctx.err( err.message||err);
        ctx.err( err.stack);
        //res.status(400).json({error: err.message||err || 'Bad Request'});
        res.status(400).text(err.message||err || 'Bad Request')
    }
}
export function required(...fields: string[]) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = function (...args: any[]) {
            for (const field of fields) {
                if (!this[field]) {
                    throw new Error(`参数${field}不能为空`);
                }
            }
            return originalMethod.apply(this, args);
        };
    };
}
const mimeTypes: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    // 根据需要补充
};

//有文件返回文件，没文件取请求接口
export function staticPlugin(staticDir: string) {
    // 支持传入相对路径，转成绝对路径
    const rootDir = path.isAbsolute(staticDir) ? staticDir : path.resolve(process.cwd(), staticDir);

    return async ({ req, res, next }) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            await next();
            return;
        }

        try {
            const url = new URL(req.url || '', `http://${req.headers.host}`);
            let filePath = path.join(rootDir, decodeURIComponent(url.pathname));
            console.log('file_path:',filePath)
            // 防止路径穿越攻击，确保文件在static目录下
            if (!filePath.startsWith(rootDir)) {
                await next();
                return;
            }

            // 如果是目录，尝试读取index.html
            const stat = await fs.promises.stat(filePath).catch(() => null);
            if (stat && stat.isDirectory()) {
                filePath = path.join(filePath, 'index.html');
            }

            // 再次确认文件存在
            const fileStat = await fs.promises.stat(filePath).catch(() => null);
            if (!fileStat || !fileStat.isFile()) {
                await next();
                return;
            }

            const ext = path.extname(filePath).toLowerCase();
            const contentType = mimeTypes[ext] || 'application/octet-stream';

            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Length', fileStat.size.toString());

            // 如果是HEAD请求，直接返回
            if (req.method === 'HEAD') {
                res.status(200).end();
                return;
            }

            // 创建文件流返回
            const stream = fs.createReadStream(filePath);
            stream.pipe(res.res); // 注意这里传入的是原生 http.ServerResponse 对象

            // 错误处理
            stream.on('error', (err) => {
                res.status(500).text('Internal Server Error');
            });
        } catch (err) {
            await next();
        }
    };
}
export function logReq() {
    return async ({ctx, req, res, next }) => {
        ctx.info('req:',ctx.req?.url)
        let rsp=await next();
        ctx.info('res:',rsp)
    };
}

