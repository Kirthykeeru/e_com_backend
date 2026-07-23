const http = require('http');
const app = require('./app');
const { initSocket } = require('./sockets/socket');

const server = http.createServer(app);
const io = initSocket(server);
app.set('io', io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Electric Shop API listening on port ${PORT}`);
});
