const express = require('express');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth')

const router = express.Router();

function generateToken(params = {}){
    return jwt.sign(params, authConfig.secret, {
        /* tempo de expiração em segundos (1 dia) */
        expiresIn: 86400,
    });
};

router.post('/register', async (req, res) => {
    const {cpf} = req.body;
    try{
        if (await User.findOne({cpf})) return res.status(400).send({error: 'User already exists'})
        const user = await User.create(req.body);

        user.password = undefined;

        return res.status(201).send({
            user,
            token: generateToken({ id: user.id})
        });
        
    } catch(err){
        return res.status(400).send({error: 'Registration failed'});
    }
});

router.put('/edit', async (req, res) =>{
    const {cpf} = req.body;
    try {
        if(!await User.findOne({cpf})) return res.status(404).send({error: 'User not found'})
        await User.updateOne(req.body);
        return res.send('Update has been completed');

    } catch (error) {
        return res.status(400).send({error: 'Edit failed'});
    }
});

router.delete('/remove', async (req, res) =>{
    const {cpf} = req.body;
    try {
        if(await User.findOneAndRemove({cpf})) return res.send('User has been removed');
        
        return res.status(404).send({error: 'User not found'});

    } catch (error) {
        return res.status(400).send({error: 'Remove failed'});
    }
});

router.post('/authenticate', async(req, res) =>{
    const {email, password} = req.body;
    const user = await User.findOne({ email }).select('+password')

    if (!user) return res.status(400).send({error: 'User not found'});

    if(!await bcrypt.compare(password, user.password)) return res.status(400).send({error: 'Invalid password'})

    user.password = undefined;

    res.send({
        user, 
        token: generateToken({ id: user.id})
    });
})

module.exports = app => app.use('/auth', router)