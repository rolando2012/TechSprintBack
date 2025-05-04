const jwt = require('jsonwebtoken');
const prisma = require('../base/db');
const bcrypt = require('bcrypt');
const config = require('../config');

const loginUser = async (req, res) => {
    const { email, password, code } = req.body;

    const user = await prisma.persona.findUnique({
        where:{
            email: email 
    }}); 

    if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    const passw = await prisma.userN.findUnique({
        select:{
            passwUser:true
        },
        where:{
            codPer: user.codPer,
            codSis: code
        }
    })

    if (!passw || !(await bcrypt.compareSync(password,passw.passwUser))){
        return res.status(401).json({ message: 'Invalid code or password' });
    }

    const rl = await prisma.rol.findFirst({
        select: {
          nombreRol: true,
        },
        where: {
          userNRol: {
            some: {
              userN: {
                codPer: user.codPer,
              },
            },
          },
        },
      });
      

    try{
        const token = jwt.sign({ id: user.codPer, name: user.nombre, rol: rl.nombreRol}, config.app.jwt, { expiresIn: '20m' });
        res.cookie('access_token',token,{
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite:'none',
            maxAge:60 * 60 * 24,
        }).send({ token, user: { id: user.codPer, name: user.nombre, email: user.email, rol: rl.nombreRol} }) ;
    }catch(error){
        res.status(401).send(error.message)
    }
    
};

const logout = async(req,res) =>{
    res
        .clearCookie('access_token')
        .json({message: 'Cerrado de sesion exitoso'})
}

module.exports ={
    loginUser,
    logout
}