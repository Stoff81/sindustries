import 'dotenv/config';
import { createApp } from './app.ts';

const port = Number(process.env.PORT || 4000);
const app = createApp();

app.listen(port, () => {
  console.log(`tasks-api listening on http://localhost:${port}`);
});
