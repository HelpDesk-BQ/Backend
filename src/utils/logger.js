// Logs estruturados (RNF07/A11): evento, horário, rota, status e correlationId.
// Nunca registrar senha, token, hash ou corpo sensível — só IDs técnicos.

function write(level, event, fields = {}) {
  const line = JSON.stringify({ level, event, timestamp: new Date().toISOString(), ...fields });
  process.stdout.write(`${line}\n`);
}

export const logger = {
  info(event, fields = {}) {
    write('info', event, fields);
  },
  warn(event, fields = {}) {
    write('warn', event, fields);
  },
  error(event, fields = {}) {
    write('error', event, fields);
  },
};
