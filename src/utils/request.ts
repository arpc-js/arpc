import { ElMessage } from 'element-plus'
//const BASE_URL = 'http://localhost'; // 或 import.meta.env.VITE_API_URL
const BASE_URL = 'http://156.238.240.143';
export async function post(path: string, body = {}) {
    try {
        const response = await fetch(BASE_URL + path, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('token')
                    ? 'Bearer ' + localStorage.getItem('token')
                    : ''
            },
            body: JSON.stringify(body),
        });
        if (response.status === 204) return null;
        const contentType = response.headers.get('Content-Type') || '';
        if (!response.ok) {
            // 错误信息也可能是 JSON
            const errorText = contentType.includes('application/json')
                ? JSON.stringify(await response.json())
                : await response.text();
/*            if (response.status==401) {
                localStorage.removeItem('token');
                location.href = '/user/login';
            }*/
            ElMessage.error(errorText || '请求失败');
            return
        }
        // 正常响应，根据类型解析
        if (contentType.includes('application/json')) {
            return await response.json();
        } else if (contentType.includes('text/')) {
            return await response.text();
        } else if (contentType.includes('application/octet-stream')) {
            return await response.blob(); // 可用于导出文件
        } else {
            // 默认 fallback：还是 text
            return await response.text();
        }
    } catch (err: any) {
        ElMessage.error(err.message || '请求异常');
        console.error('请求异常:', err);
        throw err;
    }
}
