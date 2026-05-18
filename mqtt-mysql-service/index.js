require('dotenv').config();
const mqtt = require('mqtt');
const mysql = require('mysql2/promise');

const LIMIAR = parseInt(process.env.LIMIAR_MQ135);

// Armazena as leituras temporariamente até ter todos os valores
let leituraAtual = {};

async function salvarLeitura(dados) {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });

  const alerta = dados.qualidade_ar > LIMIAR;

  await conn.execute(
    `INSERT INTO leituras (temperatura, umidade, qualidade_ar, alerta)
     VALUES (?, ?, ?, ?)`,
    [dados.temperatura, dados.umidade, dados.qualidade_ar, alerta]
  );

  await conn.end();
  console.log(`Salvo: T=${dados.temperatura}, U=${dados.umidade}, MQ=${dados.qualidade_ar}, Alerta=${alerta}`);
}

const client = mqtt.connect(process.env.MQTT_BROKER);

client.on('connect', () => {
  console.log('Conectado ao broker MQTT');
  client.subscribe('phesp8266/temperatura');
  client.subscribe('phesp8266/umidade');
  client.subscribe('phesp8266/mq135');
});

client.on('message', async (topic, message) => {
  const valor = parseFloat(message.toString());

  if (topic === 'phesp8266/temperatura') leituraAtual.temperatura = valor;
  if (topic === 'phesp8266/umidade')     leituraAtual.umidade = valor;
  if (topic === 'phesp8266/mq135')       leituraAtual.qualidade_ar = valor;

  // Salva quando tiver os 3 valores
  if (leituraAtual.temperatura && leituraAtual.umidade && leituraAtual.qualidade_ar) {
    await salvarLeitura(leituraAtual);
    leituraAtual = {}; // limpa para a próxima leitura
  }
});