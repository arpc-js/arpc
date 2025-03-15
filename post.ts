Bun.serve({
    // `routes` requires Bun v1.2.3+
    async fetch(req:Request) {
        try {
            console.log(req.headers)
            console.log(await req.json())
        }catch (e) {
            console.log('catch')
            console.log(await req.text())
        }
        return new Response("err", {status: 500});
    }
});
