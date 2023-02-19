// Import Solana web3 functinalities
const {
    Connection,
    PublicKey,
    clusterApiUrl,
    Keypair,
    LAMPORTS_PER_SOL, 
    Transaction,
    SystemProgram,
    sendAndConfirmRawTransaction,
    sendAndConfirmTransaction
} = require("@solana/web3.js");

// Create a new keypair
const newPair = Keypair.generate();

// Exact the public and private key from the keypair
const publicKey = new PublicKey(newPair._keypair.publicKey).toString();
const privateKey = newPair._keypair.secretKey;

// Connect to the Devnet
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

console.log("Public Key of the generated keypair", publicKey);

// Get the wallet balance from a given private key
const getWalletBalance = async (keypair, source) => {
    try {
        // Make a wallet (keypair) from privateKey and get its balance
        const walletBalance = await connection.getBalance(
            new PublicKey(keypair.publicKey)
        );
        if (source == 'sender') {
            console.log(`from Wallet Balance: ${parseInt(walletBalance) / LAMPORTS_PER_SOL} SOL`);
        }
        else {
            console.log(`to Wallet Balance: ${parseInt(walletBalance) / LAMPORTS_PER_SOL} SOL`);
        }
        
    } catch (err) {
        console.log(err);
    }
};

const transferSol = async() => {
    // Get Keypair from Secret Key
    var from = Keypair.fromSecretKey(privateKey);
    const to = Keypair.generate();
    
    // Aidrop 2 SOL to Sender wallet
    console.log("Airdopping some SOL to Sender wallet!");
    const fromAirDropSignature = await connection.requestAirdrop(
        new PublicKey(from.publicKey),
        2 * LAMPORTS_PER_SOL
    );

    // Latest blockhash (unique identifer of the block) of the cluster
    let latestBlockHash = await connection.getLatestBlockhash();

    // Confirm transaction using the last valid block height (refers to its time)
    // to check for transaction expiration
    await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: fromAirDropSignature
    });
    
    await getWalletBalance(from, 'sender');
    await getWalletBalance(to, 'receiver');
    
    const fromBal = await connection.getBalance(
        new PublicKey(from.publicKey)
    );
    
    console.log("Airdrop completed for the Sender account");
    
    // Send money from "from" wallet and into "to" wallet
    var transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: from.publicKey,
            toPubkey: to.publicKey,
            lamports: fromBal/2
        })
    );

    // Sign transaction
    var signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [from]
    );
    await getWalletBalance(from, 'sender');
    await getWalletBalance(to, 'receiver');

    console.log('Signature is ', signature);
}

transferSol();