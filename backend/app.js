require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors({
    origin: '*', // 请替换为您的前端域名，例如 'https://your-frontend-domain.com'
    methods: 'GET,POST',
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 引入路由
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');

// 使用路由
app.use('/products', productsRouter);
app.use('/orders', ordersRouter);

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`服务器正在运行在端口 ${PORT}`);
});