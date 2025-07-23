import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import ts from 'typescript';

const controllers: Record<string, any> = {};
const controllerCache: Record<string, any> = {};

function extractTypesFromFile(filePath: string): Record<string, Record<string, string>> {
    const sourceText = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true);
    const result: Record<string, Record<string, string>> = {};

    ts.forEachChild(sourceFile, node => {
        if (ts.isClassDeclaration(node) && node.name) {
            const className = node.name.text;
            const fields: Record<string, string> = {};

            node.members.forEach(member => {
                if (ts.isPropertyDeclaration(member) && member.name && ts.isIdentifier(member.name)) {
                    const propName = member.name.text;
                    const typeStr = member.type?.getText(sourceFile) || 'any';
                    fields[propName] = typeStr;
                }
            });

            result[className] = fields;
        }
    });

    return result;
}

function fileHasClassDeclaration(filePath: string): boolean {
    const text = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true);
    let hasClass = false;

    ts.forEachChild(sourceFile, node => {
        if (ts.isClassDeclaration(node) && node.name) {
            hasClass = true;
        }
    });

    return hasClass;
}

async function loadAndInjectTypes(filePath: string): Promise<void> {
    const fileName = path.basename(filePath).replace(/\.(ts|js)$/, '');
    const className = fileName.charAt(0).toUpperCase() + fileName.slice(1);
    if (controllerCache[className]) return;

    try {
        const typesMap = extractTypesFromFile(filePath)[className] ?? {};
        const mod = await import(pathToFileURL(filePath).toString());
        const Cls = mod.default ?? mod[className];

        if (typeof Cls !== 'function') return;

        Cls.types = typesMap;
        controllers[fileName.toLowerCase()] = Cls;
        controllerCache[className] = Cls;
    } catch (e) {
        console.warn(`[Load Failed] ${filePath}:`, (e as Error).stack || e);
    }
}

async function findAllClassFiles(
    dir: string,
    fileList: string[] = [],
    excludeFiles = ['index.ts', 'main.ts', 'server.ts', 'ArBase.ts', 'Arpc.ts']
): Promise<string[]> {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        // 排除隐藏目录、node_modules、dist 和指定排除文件
        if (
            entry.name.startsWith('.') ||
            ['node_modules', 'dist', 'core'].includes(entry.name) ||
            excludeFiles.includes(entry.name)
        ) continue;

        if (entry.isDirectory()) {
            await findAllClassFiles(fullPath, fileList, excludeFiles);
        } else if (entry.isFile() && /\.(ts|js)$/.test(entry.name)) {
            if (fileHasClassDeclaration(fullPath)) {
                fileList.push(fullPath);
            }
        }
    }

    return fileList;
}

export async function init_class(): Promise<Record<string, any>> {
    // 只扫描指定目录，改成你项目中类文件所在目录
    const scanDir = './';
    const allFiles = await findAllClassFiles(scanDir);

    await Promise.all(allFiles.map(file => loadAndInjectTypes(file)));

    return controllers;
}


console.log(await init_class())
