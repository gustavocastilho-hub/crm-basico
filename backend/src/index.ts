import { env } from './config/env';
import app from './app';

app.listen(env.PORT, () => {
  console.log(`CRM Backend rodando na porta ${env.PORT}`);
});
