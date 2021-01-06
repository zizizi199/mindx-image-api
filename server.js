require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

const AuthRouter = require('./modules/auth/auth.route');
const PostRouter = require('./modules/posts/posts.route');
const CommentRouter = require('./modules/comments/comments.route');

const log = require('./modules/shared/log');
// connect mongodb
mongoose.connect(process.env.MONGODB_URI, (err) => {
  if (err) throw err;
  console.log('MongoDB connected');
});

// khởi tạo phần http cho server
app.use(cors())
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(log)

const prefix = 'api';

// Config router
app.use(`/${prefix}/auth`, AuthRouter);
app.use(`/${prefix}/posts`, PostRouter);
app.use(`/${prefix}/comments`, CommentRouter);

app.get('/ping', (req, res) => {
  res.send('pong');
})

app.get('/', (req, res) => {
  res.send('pong');
})

// khởi tạo thêm phần websocket cho server
const server = require('http').createServer(app);
const options = {
  cors: {
    origin: '*'
  }
};

const io = require('socket.io')(server, options);
global.io = io;

io.on('connection', socket => {
  console.log(`${socket.id} connected`);

  socket.on('join-room-post', (data) => {
    socket.join(`post_${data.postId}`);
  })

  socket.on('someone-typing', (data) => {
    const room = `post_${data.postId}`
    socket.to(room).emit('user-typing', { user: data.user });
  })

  socket.on('new-comment', (data) => {
    const room = `post_${data.postId}`
    // bắn cho tất cả trong room ngoài trừ thằng socket đang .on
    socket.to(room).emit('new-comment-added', data);
  })

  socket.on('disconnect', () => {
    console.log(`${socket.id} disconnect`);
  });
});

// khởi tạo server
server.listen(process.env.PORT || 8081, (err) => {
  if (err) throw err;
  console.log('Server started');
});