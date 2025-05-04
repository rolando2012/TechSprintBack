require('dotenv').config();

module.exports = {
    app:{
        port: process.env.PORT || 4000,
        jwt: process.env.JWT_SECRET
    }
}