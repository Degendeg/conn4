const ROW_NUM = 6
const COL_NUM = 7

new Vue({
  template: `
        <div>
            <p v-if='myTurn'><strong>Your</strong> turn</p>
            <p v-else>Opponent's turn</p>
            <table id='gameboard'>
                <tr v-for='row in board.slice().reverse()'>
                    <td v-for='(value,c) in row' v-on:click='makeMove' v-on:mouseover='highlightCol'
                    v-on:mouseleave='resetColor' v-bind:style="{'background-color': hoverColors[c]}">{{value}}</td>
                </tr>
            </table>
            <p>{{infoMsg}}</p>
            <button class='button' v-if='gameEnded' v-on:click='restartGame'>Restart Game</button>
        </div>
    `,
  data: {
    board: [],
    hoverColors: [],
    myPiece: '',
    oppPiece: '',
    infoMsg: '',
    gameStarted: false,
    gameEnded: false,
    myTurn: false,
    ws: new WebSocket('ws://localhost:5000')
  },
  methods: {
    sendChoice(col) {
      this.ws.send(JSON.stringify(col))
    },

    updateBoard(board, row, col, piece) {
      let newRow = board[row].slice(0)
      newRow[col] = piece
      this.$set(board, row, newRow)
    },

    addPieceOnBoard(board, col, piece) {
      for (let i = 0; i < ROW_NUM; i++) {
        if (board[i][col] === ' ') {
          this.updateBoard(board, i, col, piece)
          return [i, col]
        }
      }
    },

    makeMove(event) {
      if (!this.gameStarted || this.gameEnded) {
        return
      }
      if (!this.myTurn) {
        this.infoMsg = 'Please wait for your turn.'
        return
      }
      this.infoMsg = ''

      let col = event.target.cellIndex
      console.log('My choice of col:', col)
      if (this.board[ROW_NUM - 1][col] !== ' ') { // if no more space left in that column
        this.infoMsg = 'No more space left. Choose another column.'
      } else {
        let myChoicePos = this.addPieceOnBoard(this.board, col, this.myPiece)
        this.myTurn = false
        if (check4Connected(this.board, this.myPiece)) { // if player wins
          myChoicePos.push('Win')
          console.log('You won!')
          this.infoMsg = 'You WON!'
          this.gameEnded = true
        }
        this.sendChoice(myChoicePos)
      }
    },

    resetColor() {
      for (let c = 0; c < COL_NUM; c++) {
        this.$set(this.hoverColors, c, 'white')
      }
    },

    highlightCol(event) {
      let col = event.target.cellIndex
      let tempBoard1 = JSON.parse(JSON.stringify(this.board))
      this.addPieceOnBoard(tempBoard1, col, this.myPiece)
      for (let c = 0; c < COL_NUM; c++) {
        let tempBoard2 = JSON.parse(JSON.stringify(tempBoard1))
        this.addPieceOnBoard(tempBoard2, c, this.oppPiece)
		/* below gives tips regarding a move that can be winnable next */
        // if (check4Connected(tempBoard2, this.oppPiece)) {
        // this.$set(this.hoverColors, col, 'lightcoral')
        // return
        // }
      }
      this.$set(this.hoverColors, col, 'palegreen')
    },

    restartGame() {
      this.board = Array(ROW_NUM).fill().map(() => Array(COL_NUM).fill(' ')); // resetting the board
      this.gameEnded = false
      this.sendChoice('Reset')
      this.infoMsg = 'Game restarted'
    }
  },

  created() {
    this.board = Array(ROW_NUM).fill().map(() => Array(COL_NUM).fill(' '));
    this.hoverColors = Array(ROW_NUM).fill('white');
  },
  mounted() {
    this.ws.onmessage = event => {
      if (!this.gameStarted) {
        if (event.data === '1') { // if this is player 1
          console.log('Connected with Server.\nYou are player 1. Waiting for player 2...')
          this.myPiece = 'X'
          this.oppPiece = 'O'
          this.myTurn = true
          this.infoMsg = 'Waiting for other player...'
        } else if (event.data === '2') { // if this is player 2
          console.log('Connected with Server.\nYou are player 2.')
          this.myPiece = 'O'
          this.oppPiece = 'X'
          this.myTurn = false
        } else if (event.data === '3') {
          console.log('Starting Game.')
          this.gameStarted = true
          this.infoMsg = ''
        }
      } else { // if game started
        oppMsg = JSON.parse(event.data)
        if (oppMsg === 'Reset') {
          console.log('Restart game request received')
          this.board = Array(ROW_NUM).fill().map(() => Array(COL_NUM).fill(' '));
          this.gameEnded = false
          this.infoMsg = 'Game restarted by opponent'
        } else {
          this.infoMsg = ''
          console.log('Opponent choice of col:', oppMsg[1])
          this.addPieceOnBoard(this.board, oppMsg[1], this.oppPiece)
          this.myTurn = true
          if (oppMsg[oppMsg.length - 1] === 'Win') { // opponent wins
            console.log('You lost!')
            this.infoMsg = 'You lost! Better luck next time.'
            this.gameEnded = true
          }
        }
      }
    }
  }

}).$mount('#game')

const check4Connected = (board, piece) => {
  // checking vertically
  for (let r = 0; r < ROW_NUM - 3; r++) {
    for (let c = 0; c < COL_NUM; c++) {
      if (board[r][c] === piece && board[r + 1][c] === piece &&
        board[r + 2][c] === piece && board[r + 3][c] === piece) {
        return true;
      }
    }
  }
  //checking horizontally
  for (let r = 0; r < ROW_NUM; r++) {
    for (let c = 0; c < COL_NUM - 3; c++) {
      if (board[r][c] === piece && board[r][c + 1] === piece &&
        board[r][c + 2] === piece && board[r][c + 3] === piece) {
        return true;
      }
    }
  }
  // checking diagonally down
  for (let i = 3; i < ROW_NUM; i++) {
    for (let j = 0; j < COL_NUM - 3; j++) {
      if (board[i][j] === piece && board[i - 1][j + 1] === piece &&
        board[i - 2][j + 2] === piece && board[i - 3][j + 3] === piece)
        return true;
    }
  }
  // checking diagonally up
  for (let i = 3; i < ROW_NUM; i++) {
    for (let j = 3; j < COL_NUM; j++) {
      if (board[i][j] === piece && board[i - 1][j - 1] === piece &&
        board[i - 2][j - 2] === piece && board[i - 3][j - 3] === piece)
        return true;
    }
  }
  return false;
}