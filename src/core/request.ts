let base_url, vue_login, uni_login;
export function initReq({ base_url:url, vue_login: vlogin, uni_login: ulogin }) {
    base_url = url;
    vue_login = ulogin;
    uni_login = ulogin;
    console.log('init:',base_url,vue_login,uni_login)
}
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

        if (response.status === 401&&vue_login) {
            localStorage.removeItem('token');
            location.href = vue_login;
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
        if (statusCode === 401&&uni_login) {
            uni.removeStorageSync('token');
            uni.redirectTo({ url: uni_login });
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
    console.log('base_url:',base_url)
    const url = base_url + path;

    try {
        const data = mode === 'adm'
            ? await webRequest(url, body, token)
            : await uniRequest(url, body, token);
        console.log(data)
        return data;
    } catch (err: any) {
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
