Bun.serve({
    routes: {
        "/users/:id": req => {
            return new Response(`Hello User ${req.params.id}!`);
        }
    },
});
