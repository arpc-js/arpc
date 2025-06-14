const BASE_URL = 'http://localhost'; // 可改为 import.meta.env.VITE_API_URL 等方式

export async function post(path:string, body = {}) {
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

        // 处理无内容的响应（如204）
        let data :any=null;
        if (response.status !== 204) {
            data = await response.json();
        }

        if (!response.ok) {
            // === 拦截 401 / 403，跳转登录 ===
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token')
                location.href = '/user/login';
                // 中断流程
                throw new Error(data['message'] || '未登录');
            }
            // 其他错误
            throw new Error(data['message'] || '请求失败');
        }

        return data;
    } catch (err) {
        // @ts-ignore
        console.error('请求异常:', err.message);
        throw err;
    }
}
