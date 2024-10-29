const express = require("express")
const bodyParser = require('body-parser')
const http = require("http")
const knex = require("knex")({
    client : "mysql",
    connection : {
        host : "localhost",
        user : "root",
        database : "bd_dsapi",
        password : ""
    }
})
const app = express()


app.get("/", (req, res) => {
    res.status(200).send("Bem vindo Atividade 01 DSAPI")
})

app.get("/produtos", (req, res) => {

    knex("produtos").then((dados) => {
        if(dados.length === 0){
            res.send("Nenhum produto cadastrado")
        } else {
            res.send(dados)
        }
    })
})

http.createServer(app).listen( 8002, () => {
    console.log("Servidor rodando em: http://localhost:8001")
})

