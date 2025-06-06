const jwt = require('jsonwebtoken');
const prisma = require('../base/db');
const bcrypt = require('bcrypt');
const config = require('../config');

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    let user = await prisma.persona.findUnique({
        where:{
            email: email 
    }}); 

    if (!user) {
        const aux = await prisma.persona.findFirst({
            where:{
                nombre: email,
            }
        });
        if(!aux){
            return res.status(401).json({ message: 'Invalid email or password' });
        }else{
            user=aux;
        }
    }

    const passw = await prisma.userN.findUnique({
        select:{
            passwUser:true
        },
        where:{
            codPer: user.codPer,
           
        }
    })

    if (!passw || !(await bcrypt.compareSync(password,passw.passwUser))){
        return res.status(401).json({ message: 'Invalid email or password' });
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
        const token = jwt.sign({ id: user.codPer, name: user.nombre, rol: rl.nombreRol}, config.app.jwt, { expiresIn: '90d' });
        res.cookie('access_token',token,{
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite:'none',
            maxAge: 90 * 24 * 60 * 60 * 1000,  // 90 días en milisegundos
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