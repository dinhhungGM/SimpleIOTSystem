const express = require('express');
const app = express();

if(process.env.NODE_ENV !== 'production') {
    const morgan = require('morgan');
    app.use(morgan('dev'));
}


app.listen(4000, () => {
    console.log('Server is running on port 3000');
}); 