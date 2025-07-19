const BASE_URL = 'http://127.0.0.1'; // 建议改为 import.meta.env.VITE_API_URL
async function webRequest(url: string, body: any, token: string) {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? 'Bearer ' + token : ''
        },
        body: JSON.stringify(body),
    });

    const contentType = response.headers.get('Content-Type') || '';

    if (response.status === 204) return null;

    if (!response.ok) {
        const errorText = contentType.includes('application/json')
            ? JSON.stringify(await response.json())
            : await response.text();

        if (response.status === 401) {
            localStorage.removeItem('token');
            location.href = '/login';
        }

        throw new Error(errorText);
    }

    if (contentType.includes('application/json')) {
        return await response.json();
    } else if (contentType.includes('text/')) {
        return await response.text();
    } else if (contentType.includes('application/octet-stream')) {
        return await response.blob();
    } else {
        return await response.text();
    }
}

// ✅ 用 await 重写的 uni.request（无回调）
async function uniRequest(url: string, body: any, token: string): Promise<any> {
    // @ts-ignore
    const res = await uni.request({
        url,
        method: 'POST',
        header: {
            'Content-Type': 'application/json',
            'Authorization': token ? 'Bearer ' + token : ''
        },
        data: body
    }).catch(err => [err, null]);
    console.log(res)
    //@ts-ignore
    const { statusCode, data } = res;
    if (statusCode === 204) return null;
    if (statusCode >= 200 && statusCode < 300) {
        return data;
    } else {
        if (statusCode === 401) {
            uni.removeStorageSync('token');
            uni.redirectTo({ url: '/pages/login/login' });
        }
        throw new Error(typeof data === 'string' ? data : JSON.stringify(data));
    }
}

export async function post(mode: string, obj: any, path: string, body: any = {}) {
    let token = ''
    if (mode=='adm') {
        token = localStorage.getItem('token') || ''
    } else {
        token = uni.getStorageSync('token') || ''
    }
    const url = BASE_URL + path;

    try {
        const data = mode === 'adm'
            ? await webRequest(url, body, token)
            : await uniRequest(url, body, token);
        console.log(data)
        return data;
    } catch (err: any) {
        if (err.message === 'Not Found' && obj) {
            obj.total = 0;
            obj.list = [];
        }
        if (mode === 'adm') {
            //@ts-ignore
            window.$message?.error?.(err.message || '请求异常');
        } else {
            uni.showToast({
                title: err.message || '请求异常',
                icon: 'none',
                duration: 2000
            });
        }
        throw err;
    }
}
