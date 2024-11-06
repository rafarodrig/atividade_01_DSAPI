const express = require("express")
const app = express()
const PORT = 8002
const HOSTNAME = "localhost"
const knex = require("knex")({
    client : "mysql",
    connection : {
        host : "localhost",
        user : "root",
        database : "bd_dsapi",
        password : ""
    }
})


function verficarTabProdutos (req, res, next){
    knex("produtos")
    .then((dados) => {
        if(dados.length === 0) {
           return res.status(422).send({"status":422, "mensagem": "Nenhum produto cadastrado"})
        }
        next()// redireciona para o proximo endpoint do metodo utilizado  
    })
}

async function verificarProduto(id_produto){
    return await knex("produtos")
    .where("id", id_produto)
    .first()
    .then((resposta) =>{
        if(!resposta){
            return false
            }
        return true
        })
}

function verificarCliente(req, res, next){
    const cliente_id = req.body.cliente_id
    knex("clientes")
        .where("id", cliente_id )
        .first()
        .then((resposta) =>{
            if(!resposta){
                return res.status(422).send({"status":422,"mensagem":`Cliente com esse o id ${cliente_id} não existe`})
            }
            next()
        })
}

app.use(express.json())


// Verifica se a requisicao esta sendo feita em uma url e metodo validos

    

    // let metodosValidos = {
    //     "/" : ["GET"],

    //     "/produtos" : ["GET","PUT","POST"],
    //     "/produtos/info" : ["GET"],
    //     "/produtos/:idProd" : ["GET","DELETE"],

    //     "/clientes" : ["GET","POST"],
    //     "/clientes/info" : ["GET"],

    //     "/pedidos" : ["GET","POST"],
    //     "/pedidos/info" : ["GET"],
    //     "/pedidos/:idPedido": ["GET"],

    //     "/test": ["GET"]
    // }

    // if(!metodosValidos.hasOwnProperty(req.originalUrl)){
    //     return res.status(404).send({"status":405,"mensagem":`Url inválida ${req.originalUrl}`})
    // }
    // else if(!metodosValidos[req.originalUrl].includes(req.method) ){
    //     return res.status(405).send({"status":405,"mensagem":"Metodo não permitido nessa url"})
    // }
    // next()
    
function verificarLogin (req, res, next) { // Verifica se a url e o metodo sao restritos apenas aos admins

    const adminDados = {
        "usuario" :"Admin",
        "senha": "123"
    }

        if(!req.body.hasOwnProperty("admin")){
            return res.status(401).send({
                "status":401,
                "mensagem":"Acesso negado. Para executar essa operacao nessa url é nescessario fazer o login, adicionando a propriedade login ao corpo da requisicao (exemplo abaixo)",
                "admin" : {
                    "usuario" :"Admin",
                    "senha": "123"
                }
            })
        }
        else if(req.body.admin.usuario != adminDados.usuario || req.body.admin.senha != adminDados.senha){
            return res.status(401).send({"status":401,"mensagem":"Acesso negado. Por favor insira os dados de login corretos"})
        } 

        next()
    }

    
        
    

// Clientes handlers =================================

// Cliente info



app.get("/clientes/info", (req, res) => {
    res.status(200).send({
        "/clientes" : {                    
            "POST": {  
                "nome": "(string)",
                "altura": "(float) {cm}",
                "nascimento":"(string) {yyyy-mm-dd}",
                "cidade_id" : "(int)"
            }
        }
    })
})

// Cadastro cliente
app.post("/clientes", (req, res) => {
    knex("clientes")
        .insert(req.body)
        .then((dados)=>{
            res.send((!dados) ? {"status":400,"mensagem":"Não foi possível cadastrar cliente"} : {"status":200,"mensagem":"Cliente cadastrado com sucesso"})
        })
})

app.get("/test",(req, res) =>{
    knex("produtos")
        .where("id", 1)
        .andWhere(knex.raw("(quantidade - 5) >= 0"))
        .decrement("quantidade",5)
        .then((dados)=>{
            if(!dados){
                res.send("ERRO")
            } else {
                res.send("SUCESSO")
            }
        })
})


    
// Produtos handlers ====================================================

// Produtos info
app.get("/produtos/info", (req, res) => {
    res.status(200).send({
    
        "/produtos" : {
            "GET" : "Retorna os dados de todos os produtos cadastrados",
            "POST" : {
                "descricao": "Cadastra um ou mais produtos",
                "modelo" : {
                    "admin" : {
                      "usuario" : "(string)",
                      "senha" : "(string)"
                    },
                    "produtos" : [
                     {
                        "nome" : "(string)",
                        "preco" : "(float)",
                        "quantidade" : "(float)",
                        "categoria_id" : "(int)"
                    }
                 ]
                }   
            },
            "PUT" : {
            "descricao": "Editar um ou mais produtos",
            "modelo" : {
                "admin" : {
                    "usuario" : "(string)",
                    "senha" : "(string)"
                },
                "produtos" : [
                    {  
                    "id" : "(int)",
                    "nome" : "(string)",
                    "preco" : "(float)",
                    "quantidade" : "(float)",
                    "categoria_id" : "(int)"
                }
                ]   
            }
        },
            
            "/produtos/{idProduto}" : {
                "GET" : "Retorna os dados do produto de id definido",
                "DELETE" : "Deleta o produto de id definido",
            }
        } 
    })
})

// Consultar todos os produtos
app.get("/produtos", verficarTabProdutos, (req, res) => {
    try {
        knex("produtos")
        .then((dados) => {
            res.status(200).send({"status":200,"Produtos":dados})
        })
    } catch (err){
        res.status(500).send({"status":500,"mensagem":"Erro ao buscar os dados no banco"})
    }
})

// Consultar um produto
app.get("/produtos/:idProd", (req, res) => {
    let id = req.params.idProd
    knex("produtos")
        .where("id" , id )
        .first()
        .then( (dados)=>{
            res.send((!dados) ? {"status":204,"mensagem":"Produto não encontrado"} : {"status":200,"Produto":dados})
        })
})

//Cadastrar um ou mais produtos (Admin)
app.post("/produtos", verificarLogin, (req, res) => {
    knex("produtos")
        .insert(req.body.produtos)
        .then((dados) => {
            res.status(200).send((!dados) ? {"status":200,"mensagem":"Não foi possível cadastrar produto"} : {"status":200,"mensagem":"Produto cadastrado com sucesso"})
        })
})

//Editar produto (Admin)
app.put("/produtos", verificarLogin, verficarTabProdutos,  (req, res) =>{

    (async (req, res) => {

        const produtos = req.body.produtos
        
        let mensagens = []
        
        for (const produto of produtos) {
   
            if(!await verificarProduto(produto.id).then((resposta) =>{ return resposta}))
            {
                return res.send({"mensagem" : `O produto de id ${produto.id} não existe, operacao cancelada`})
            }
        mensagens.push( await knex("produtos")
        .where("id",produto.id)
        .update(produto)
        .then((dados) => { 
            return (!dados) ? {"status":200,"mensagem":`Não foi possível editar produto de ${produto.id}`} : {"status":200,"mensagem":`Produto de id ${produto.id} editado com sucesso`}
        }))

    }

    return res.send({"mensagens": mensagens})
    
})(req, res)

})

//Deletar produto (Admin)
app.delete("/produtos/:idProd", verificarLogin, verficarTabProdutos, (req, res) =>{
    id = req.params.idProd
    knex("produtos")
        .where("id",id)
        .delete()
        .then( (dados) => {
            res.status(200).send((!dados) ? {"status":200,"mensagem":"Não foi possível deletar produto"} : {"status":200,"mensagem":"Produto deletado com sucesso"})
        })
})




// Pedidos handlers =======================================================

//Pedidos info
app.get("/pedidos/info", (req, res) => {
    return res.status(200).send({
        "/pedidos" : {
                // "GET" : "Retorna todos os pedidos cadastrados", 
                "POST" : {
                    "descricao": "Cadastra um ou mais produtos",
                    "modelo": {
                        "cliente_id" : "(int)",
                        "endereco" : "(string)",
                        "produtos" : [{
                            "produto_id" : "(int)",
                            "quantidade" : "(int)",
                            "preco" : "(float)"
                        }]
                    }
                }
            },
        "/pedidos/{idCliente}" : {
            "GET" : "Retorna todos os pedidos do cliente"
        }
    })
})

app.get("/pedidos/:idCliente", (req, res) =>{

    id = req.params.idCliente

    knex("pedidos")
    .where("cliente_id", id)
    .then((dados)=>{
        if(dados.length == 0){
            return res.send({"status": 204,"mensagem" : "Nenhum pedido cadastrado"})
        }
        return res.send({"status": 200,"pedidos" : dados})
    })
})


//Cadastrar pedido 
app.post("/pedidos",verficarTabProdutos, verificarCliente,  (req, res) => {
    
   (async (req, res) => {
        
        const produtos_requisitados = req.body.produtos
        const cliente_id = req.body.cliente_id
        const endereco = req.body.endereco
        const data = new Date()     
        const horario = data.toISOString().slice(0, 19).replace('T', ' ')
        try{

            await knex.transaction(async (trx) => {
                
                let id_pedido = await trx("pedidos")
                .insert({cliente_id:cliente_id, endereco:endereco, horario:horario})
                .then((id) => {return id})
                // .catch(() =>{
                    //    return res.send({"status":500,"mensagem":"Erro ao cadastrar pedido"})
                    // }) 
                    
                    
                    produtos_requisitados.forEach(produto => {
                        produto.pedido_id = id_pedido
                    });
                    for (const produto of produtos_requisitados) {
                        trx("produtos")
                        .where("id", produto.produto_id)
                        .andWhere(knex.raw(`(quantidade - ${produto.quantidade}) >= 0`))
                        .decrement("quantidade", produto.quantidade)
                        .then((dados)=>{
                            if(!dados){
                                return res.send({"status": 204,"mensagem": `Estoque insuficiente do produto de id ${produto.id} para a quantidade desejada de ${produto.quantidade}`})
                            }     
                        })
                    }
                    
                    trx("pedidos_produtos")
                    .insert(produtos_requisitados)
                    // .catch(() => { return res.send({"status":400,"mensagem":"Erro ao cadastrar os produtos do pedido"})})                
                    
                    return res.send("Pedido cadastrado com sucesso")
                })
                
            } catch (error){
                console.log(error)
            }
                
            })(req, res)
            
        })


app.use(function(req, res) {
    res.status(404).send({"mensagem" : "Url invalida"});
});
        


app.listen(PORT, (err) => {
    if(err) console.log(err)
    console.log(`Servidor rodando em: http://${HOSTNAME}:${PORT}`)
})

