import { Router } from "express";
import userModel from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cookie from "cookie-parser";
import { verifyRefreshToken, generateTokens, verifyAccessToken } from "../utils/auth.js";


const router = Router()

router.post("/register", async (req, res) => {

    const { name, email, password } = req.body
    const isUserExist = await userModel.findOne({ email })

    if (isUserExist) {
        return res.status(201).json({
            message: "The user already exist",
            errore: [
                {
                    path: "email",
                    message: "The user already exist"
                }
            ]
        })
    }
    const user = await userModel.create({
        name,
        email,
        password: await bcrypt.hash(password, 12)
    })

    const { accessToken, refreshToken } = generateTokens({ userId: user._id })
    user.refreshToken = refreshToken
    await user.save()

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true
    })

    res.status(201).json({
        message: "THe user registered succesfully",
        data: {
            user: {
                name: user.name,
                email: user.email,
                password: user.password
            }
        },
        accessToken
    })

})

router.get("/me", async (req, res) => {

    const accessToken = req.headers.authorization

    try {

        const decoded = verifyAccessToken(accessToken)
        const user = await userModel.findById(decoded.id)

        res.status(201).json({
            message: "user fetched successfully",
            data:{
                user:{
                    name:user.name,
                    email:user.name,
                }
            }
        })

    } catch (error) {
        console.log("Error", error.message)
        return res.status(401).json({
            message:"User not found/ unathorized"
        })
    }

})

router.post("/refresh", async (req, res)=>{
    
    const refreshToken = req.cookies.refreshToken

    if(!refreshToken){
        return res.status(401).json({
            message:"THe user not found"
        })
    }

    try {
        
        const decoded = verifyRefreshToken(refreshToken)
        const user = await userModel.findById(decoded._id)


        if(refreshToken !== user.refreshToken){
            user.refreshToken = null
            await user.save()

            return res.status(401).json({
                message:"unathorizred token"
            })
        } 

        const {accessToken, refreshToken:newRefreshToken} = generateTokens(userId._id)

        res.cookie("refreshToken", newRefreshToken, {httpOnly:true})

        res.status(201).json({
            message:"Saved successfully"
        })

    } catch (error) {

        return res.status(401).json({
            messsage:"unathorized refreshToken"
        })
    }

})

export default router;