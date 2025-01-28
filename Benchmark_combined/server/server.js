import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataFile = join(__dirname, 'benchmark_results.json');

const app = express();
app.use(cors());
app.use(express.json());

async function readData() {
    try {
        const data = await fs.readFile(dataFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { results: [] };
    }
}

async function writeData(data) {
    await fs.writeFile(dataFile, JSON.stringify(data, null, 2));
}

app.get('/api/results', async (req, res) => {
    const data = await readData();
    res.json(data.results);
});

app.post('/api/results', async (req, res) => {
    const data = await readData();
    const newResults = req.body;
    data.results.push(...newResults);
    await writeData(data);
    res.json({ success: true });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
