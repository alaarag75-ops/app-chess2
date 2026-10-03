const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// تقديم الملفات الثابتة من مجلد public
app.use(express.static(path.join(__dirname, 'public')));

// إدارة اتصالات اللعب أونلاين بـ Socket.io
io.on('connection', (socket) => {
    console.log('لاعب جديد متصل:', socket.id);

    socket.on('joinGame', (roomId) => {
        socket.join(roomId);
        socket.to(roomId).emit('playerJoined', socket.id);
    });

    socket.on('makeMove', (data) => {
        // إعادة إرسال الحركة للاعب الثاني في نفس الغرفة
        socket.to(data.roomId).emit('moveMade', data.move);
    });

    socket.on('disconnect', () => {
        console.log('لاعب قطع الاتصال:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 السيرفر يعمل على البورت http://localhost:${PORT}`);
});
