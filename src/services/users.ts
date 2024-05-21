'use server'
import { PrismaClient } from "@prisma/client"

import { getSalt, hashPassword } from "../helpers/hashPassword";
import { cookies } from "next/headers";
import { signJWT } from "@/helpers/jwt";

const prisma = new PrismaClient()
let cantMadera = 500
let cantPan = 800
let cantPiedra= 600
let unidadesDeTrabajo = 100

export async function createUser(user: { email: string, password: string, username: string}) {
  if (!user.email || user.email.length < 5 || !user.email.includes('@') ) {
    throw new Error('Invalid email');
  }
  if (!user.username || user.username.length < 3){
    throw new Error('Invalid username');
  }
  const existing = await prisma.users.findFirst({
    where: {
      email: user.email
    }
  })
  if (existing) {
    throw new Error('User already exists');
  }
  const existingUsername = await prisma.users.findFirst({
    where: {
      username: user.username
      }
  })
  if (existingUsername) {
    throw new Error('Username already exists');
  }

  if (!user.password || user.password.length < 8) {
    throw new Error('Password too short');
  }

  const salt = getSalt();

  const  userWithHash = {
    username: user.username,
    email: user.email,
    hash: hashPassword(salt + user.password),
    piedra: cantPiedra,
    pan: cantPan,
    madera: cantMadera,
    nivel:1, 
    salt,
    unidadesDeTrabajo
}

  await prisma.users.create({ data: userWithHash });
}

export async function authenticateUser(user: {username:string, email: string, password: string }) {

  const existing = await prisma.users.findFirst({
    where: {
      email: user.email
    }
  })
  if (!existing) {
    throw new Error('User not found');
  }
  const hash = hashPassword(existing.salt + user.password);
  console.log("el hash nuevo: ", hash)
  console.log("el hash existente: ", existing.hash)
  if (hash !== existing.hash) {
    throw new Error('Invalid password');
  }
  
  cookies().set("user" , signJWT(hash) , { httpOnly: true,/*  sameSite: 'strict'  */})
 /*  cookies().set("userName" , user.username , { httpOnly: true, sameSite: 'strict' }) */
 

  return { email: existing.email, username: existing.username };
}


export const getUserByUserName = async (userName:string) => {
  const users = await prisma.users.findFirst({
    where: {
      username: userName
    }
  })        
  return users
}
export const getUserByemail = async (email?:string) => {
  const users = await prisma.users.findFirst({
    where: {
      email: email
    }
  })   
   return users
}
export const getUserByHash = async (hash:string) => {
  const users = await prisma.users.findFirst({
    where: {
      hash: hash
    }
  }) 
  if(users)  return users
  /* else return false   */
}
//método que me devuelve un booleano de si existe el usuario
export const getBoolUserExist = async (email:string) => {
  const users = await prisma.users.findFirst({
    where: {
      email: email
    }
  })  
  if(users)  return true
  else return false    
}
export const getUserById= async (Id:string) => {
  const users = await prisma.users.findFirst({
    where: {
      id: Id
    }
  }) 
  return users
  /* else return false   */
}
export async function updateUser(Id: string, data: any) {
  const u = await prisma.users.update({
    where: {
      id: Id
    },
    data: data
  })
  console.log(`User ${Id} updated: `, u)
  return u
}
