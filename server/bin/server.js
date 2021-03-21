#! /usr/bin/env node

import dotenv from 'dotenv';
import getApp from '../index.js';

dotenv.config();

const port = process.env.PORT || 5000;
// const address = process.env.ADDRESS;
const address = '0.0.0.0';

getApp().listen(port, address, () => {
  console.log(`Server is running on port: ${port}`);
});
