# solana-chess-react
solana-chess-react is the React web app component of a Web3 application that
allows chess gameplay off the Solana blockchain.

# Context
This is derived from buildspace's Solana Web3 app project. The project involved
uploading GIFs of a chosen theme to the blockchain. It was meant to highlight
how data could be stored on the blockchain and retrieved at anytime, without
reliance on local storage or databases.

However, I rushed through that project a bit and have since realized how much
more applications can take advantage of the blockchain. Chess on the blockchain
was one of several ideas I thought of.

# Usage
This will always be directed to use an instance of the program component. The
program component is uploaded to the Solana devnet, so this will not require you
to own any SOL.

You will however be required to have a Solana wallet configured to use the
devnet, such as Phantom.

## Deployment
You don't really need to deploy your own local copy of this project due to the
reasons mentioned above, but if you really want to...

### Requirements
- A local installation of:
  - Git
  - node.js

### Directions
1. Clone this repo using Git.
2. Navigate to the repo's directory and run `npm install`.
3. Run `npm run start`.

After a while, the web app should be open at `localhost:3000` within your
preferred web browser.

## Gameplay
Assuming you've deployed a local copy or are using an already-deployed instance
of it, this covers how a basic game will go.

As you could probably guess, it's a game of chess where turns alternate between
the white and black sides. However, anyone can make a turn if they have a Solana
wallet. A SOL transaction is prompted every time a move is made.

All this means that multiple people could be controlling multiple sides at once.
It's not really meant to be serious since this project was designed with the
intent of playing around with the Solana blockchain, but if multiple people
wanted to, you could totally play out a full match.
