require('dotenv').config();
const { ethers } = require('ethers');
const readline = require('readline');

// Setup provider et wallet
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Adresses et ABI
const contractAddress = process.env.CONTRACT_ADDRESS;
const usdtAddress = process.env.USDT_ADDRESS;

// ABI simplifié
const abi = [
  "function deposit(uint256 amount) public",
  "function redeem(uint256 amount) public",
  "function balanceOf(address account) view returns (uint256)",
  "function timeUntilUnlock(address user) view returns (uint256)",
  "function transferStake(address to, uint256 amount) public"
];

// Crée le contrat
const contract = new ethers.Contract(contractAddress, abi, wallet);

// readline pour interaction console
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Fonctions principales
async function deposit() {
  rl.question("Montant d'USDT à déposer : ", async (amountStr) => {
    try {
      const amount = ethers.parseUnits(amountStr, 6); // USDT: 6 décimales
      // Approve
      const usdtAbi = ["function approve(address spender, uint256 amount) public returns (bool)"];
      const usdtContract = new ethers.Contract(usdtAddress, usdtAbi, wallet);
      const txApprove = await usdtContract.approve(contractAddress, amount);
      console.log(`⏳ Approve Tx: ${txApprove.hash}`);
      await txApprove.wait();
      console.log("✅ Approve confirmé !");
      // Dépôt
      const txDeposit = await contract.deposit(amount);
      console.log(`⏳ Dépôt Tx: ${txDeposit.hash}`);
      await txDeposit.wait();
      console.log("✅ Dépôt confirmé !");
    } catch (error) {
      console.error("⛔ Erreur lors du dépôt :", error);
    } finally {
      rl.close();
    }
  });
}

async function redeem() {
  rl.question("Montant de AAA à retirer : ", async (amountStr) => {
    try {
      const amount = ethers.parseUnits(amountStr, 18); // AAA: 18 décimales
      const tx = await contract.redeem(amount);
      console.log(`⏳ Redeem Tx: ${tx.hash}`);
      await tx.wait();
      console.log("✅ Redeem confirmé !");
    } catch (error) {
      console.error("⛔ Erreur lors du redeem :", error);
    } finally {
      rl.close();
    }
  });
}

async function checkBalance() {
  const balance = await contract.balanceOf(wallet.address);
  console.log(`💰 Balance AAA: ${ethers.formatUnits(balance, 18)}`);
  rl.close();
}

async function timeUntilUnlock() {
  const remaining = await contract.timeUntilUnlock(wallet.address);
  if (remaining === 0n) {
    console.log("🔓 Votre solde est déjà déverrouillé !");
  } else {
    const seconds = Number(remaining);
    const minutes = Math.floor(seconds / 60);
    const secondsLeft = seconds % 60;
    console.log(`⏳ Temps restant avant déverrouillage : ${minutes} min ${secondsLeft} sec`);
  }
  rl.close();
}

async function transferAAA() {
    rl.question("Adresse du destinataire : ", (toAddress) => {
      rl.question("Montant de AAA à transférer : ", async (amountStr) => {
        try {
          const amount = ethers.parseUnits(amountStr, 18); // AAA: 18 décimales
          const tx = await contract.transferStake(toAddress, amount);
          console.log(`⏳ Transfert AAA Tx: ${tx.hash}`);
          await tx.wait();
          console.log(`✅ Transfert de ${amountStr} AAA vers ${toAddress} confirmé !`);
        } catch (error) {
          console.error("⛔ Erreur lors du transfert :", error);
        } finally {
          rl.close();
        }
      });
    });
  }  

// Menu principal
rl.question("Que veux-tu faire ? (1: Déposer, 2: Retirer (redeem), 3: Balance AAA, 4: Temps restant unlock, 5: Transférer AAA) : ", (choice) => {
    if (choice === '1') {
      deposit();
    } else if (choice === '2') {
      redeem();
    } else if (choice === '3') {
      checkBalance();
    } else if (choice === '4') {
      timeUntilUnlock();
    } else if (choice === '5') {
      transferAAA();
    } else {
      console.log("⛔ Choix invalide.");
      rl.close();
    }
  });
  
