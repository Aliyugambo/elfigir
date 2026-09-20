const { createServer } = require('http');
const next = require('next');

const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({
  dev: false,
  hostname,
  port,
});

const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    createServer((req, res) => {
      handle(req, res);
    }).listen(port, hostname, () => {
      console.log(`> Elfijr Kitchen frontend running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start Elfijr Kitchen frontend:', err);
    process.exit(1);
  });
