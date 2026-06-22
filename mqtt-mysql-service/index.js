require('dotenv').config();
const mqtt = require('mqtt');
const db = require('./dashboard-iot/firebase');

const LIMIAR = parseInt(process.env.LIMIAR_MQ135) || 300;
const ESTACAO_ID = 'CknXsRoUd81yyTOuU6zW'; // ID da estação no Firestore

let leituraAtual = {};

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

  if (leituraAtual.temperatura && leituraAtual.umidade && leituraAtual.qualidade_ar) {
    try {
      const alerta = leituraAtual.qualidade_ar > LIMIAR;

      await db.collection('leituras').add({
        estacao_id: ESTACAO_ID,
        temperatura: leituraAtual.temperatura,
        umidade: leituraAtual.umidade,
        qualidade_ar: leituraAtual.qualidade_ar,
        alerta,
        data_hora: new Date().toISOString(),
      });

      console.log(`Salvo: T=${leituraAtual.temperatura}, U=${leituraAtual.umidade}, MQ=${leituraAtual.qualidade_ar}, Alerta=${alerta}`);
    } catch (err) {
      console.error('Erro ao salvar no Firebase:', err);
    }

    leituraAtual = {};
  }
});