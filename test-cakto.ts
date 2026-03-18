import axios from 'axios';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config({ path: './apps/api/.env' });

const clientId = process.env.CAKTO_CLIENT_ID;
const clientSecret = process.env.CAKTO_CLIENT_SECRET;
const baseUrl = 'https://api.cakto.com.br/public_api';

async function run() {
  console.log('Authenticating...');
  const tokenRes = await axios.post(`${baseUrl}/token/`, new URLSearchParams({
    client_id: clientId!,
    client_secret: clientSecret!,
  }), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  
  const token = tokenRes.data.access_token;
  console.log('Token:', token.substring(0, 10) + '...');

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  console.log('1. Fetching products...');
  const productsRes = await axios.get(`${baseUrl}/products/`, { headers });
  const results = productsRes.data.results || [];
  let out = 'Products found:\n';
  results.forEach((p: any) => {
    out += `- ID: ${p.id}, Name: "${p.name}"\n`;
  });
  fs.writeFileSync('cakto-products-utf8.txt', out, 'utf-8');
}

run().catch(console.error);
