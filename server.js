const fs = require('fs')
const http = require('http')
const ws = require('ws')
const PORT = 5000

const readFile = file => new Promise(resolve =>
  fs.readFile(file, 'utf-8', (err, data) => resolve(data)))

const server = http.createServer(async (req, resp) => {
  if (req.url === '/') {
    resp.end(await readFile('index.html'))
  } else if (req.url === '/client.js') {
    resp.end(await readFile('client.js'))
  } else if (req.url === '/vue.min.js') {
    resp.end(await readFile('vue.min.js'))
  } else {
    resp.end()
  }
});

server.listen(PORT, function() {
  console.log('Server listening at port %d', PORT);
});

let firstClient, secondClient

const playGame = (player1, player2) => {
  player1.on('message', msg => {
    console.log('Message received from player1: ', msg)
    player2.send(msg)
  })

  player2.on('message', msg => {
    console.log('Message received from player2: ', msg)
    player1.send(msg)
  })
}

new ws.Server({ server }).on('connection', client => {
  if (firstClient) {
    secondClient = client
    console.log('Player 2 connected. Initiating game.')
    secondClient.send('2')

    firstClient.send('3')
    secondClient.send('3')

    playGame(firstClient, secondClient)

    firstClient = undefined
    secondClient = undefined
  } else {
    firstClient = client
    console.log('Player 1 connected. Waiting for Player 2.')
    client.send('1')
  }

  client.on('close', () => {
    console.log('A player disconnected')
  })
})
