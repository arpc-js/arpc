// scripts/generate-pages.js
import fs from 'fs';
import path from 'path';

const rootDir = path.resolve();
const pagesDir = path.resolve(rootDir, 'src/pages');
const pagesJsonPath = path.resolve(rootDir, 'src/pages.json');

/**
 * 递归扫描 pages 目录，收集所有 .vue 页面
 * @param {string} dir 当前扫描目录
 * @param {string} parentPath 相对 pagesDir 的路径前缀
 * @returns {Array} 页面对象数组
 */
function scanPageFiles(dir = pagesDir, parentPath = '') {
    const foundPages = [];

    // 读取当前目录下所有文件和文件夹
    let items = fs.readdirSync(dir);

    // 把当前目录的 index.vue 排到最前面（仅当前目录内排序）
    items = items.sort((a, b) => {
        if (a === 'index.vue') return -1;
        if (b === 'index.vue') return 1;
        return 0;
    });

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // 递归扫描子目录
            foundPages.push(...scanPageFiles(fullPath, path.posix.join(parentPath, item)));
        } else if (item === 'index.vue' || item.endsWith('.vue')) {
            // 计算页面路径，统一用 posix 斜杠，避免 Windows 路径问题
            const routePath = path.posix.join(parentPath, item.replace('.vue', ''));

            foundPages.push({
                path: `pages/${routePath}`,
                style: {
                    navigationBarTitleText: '',
                    enablePullDownRefresh: true
                }
            });
        }
    }

    return foundPages;
}

/**
 * 更新 pages.json 文件的 pages 字段
 * @param {Array} scannedPages 扫描得到的页面数组
 */
function updatePagesJson(scannedPages) {
    if (!fs.existsSync(pagesJsonPath)) {
        console.error('❌ 找不到 pages.json 文件');
        process.exit(1);
    }

    const raw = fs.readFileSync(pagesJsonPath, 'utf-8');
    const config = JSON.parse(raw);

    const existingPages = config.pages || [];

    const scannedPaths = new Set(scannedPages.map(p => p.path));
    const existingPaths = new Set(existingPages.map(p => p.path));

    // 新增页面（扫描有但现有没有）
    const pagesToAdd = scannedPages.filter(p => !existingPaths.has(p.path));
    // 保留页面（扫描和现有都有）
    const pagesToKeep = existingPages.filter(p => scannedPaths.has(p.path));
    // 删除页面（现有有但扫描没有）
    const pagesToRemove = existingPages.filter(p => !scannedPaths.has(p.path));

    // 合并保留和新增页面，删除页面不加入
    const mergedPages = [...pagesToKeep, ...pagesToAdd];

    // 先全局排序，把所有以 /index 结尾的页面排在最前面
    mergedPages.sort((a, b) => {
        const aIsIndex = a.path.endsWith('/index');
        const bIsIndex = b.path.endsWith('/index');

        if (aIsIndex && !bIsIndex) return -1;
        if (!aIsIndex && bIsIndex) return 1;
        return 0;
    });

    config.pages = mergedPages;

    fs.writeFileSync(pagesJsonPath, JSON.stringify(config, null, 2));

    console.log(`🔍 保留: ${pagesToKeep.length}, 新增: ${pagesToAdd.length}, 删除: ${pagesToRemove.length}`);
    pagesToAdd.forEach(p => console.log(`  [新增] ${p.path}`));
    pagesToRemove.forEach(p => console.log(`  [删除] ${p.path}`));
}

/**
 * 脚本主流程
 */
function main() {
    const scannedPages = scanPageFiles();
    updatePagesJson(scannedPages);
}

main();
